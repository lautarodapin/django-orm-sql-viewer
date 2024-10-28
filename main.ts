import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import tmp from 'tmp';

const imports = `
from django.contrib.auth.models import User
`;
const query = `
User.objects.all()
`;

async function getDjangoSQL(query: string, imports: string, options?: any = {}) {
    const pythonScript = `
import sys

sys.path.append("${path.join(__dirname, 'django_project')}")
import django
import os
from io import StringIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', '${options.settings ?? 'settings'}')
from django.conf import settings
django.setup()


# Import the models from all apps
from django.apps import apps
for app in apps.get_app_configs():
    import_module(app.name).models

${imports}


original_stdout = sys.stdout
sys.stdout = buffer = StringIO()


buffer.write(${query}.query.sql_with_params()[0])

sys.stdout = original_stdout
print(buffer.getvalue())`;

    tmp.setGracefulCleanup();
    const tmpObj = tmp.fileSync({ postfix: '.py' });
    const tmpFile = tmpObj.name;
    fs.writeFileSync(tmpFile, pythonScript);

    return new Promise((resolve, reject) => {
        const child = spawn('python3.12', [tmpFile], {});

        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            console.error(`Error getting SQL: ${data.toString()}`);
            reject(data.toString());
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                console.error(`Error getting SQL (code ${code})`);
                reject(`Error getting SQL (code ${code})`);
            }

            tmpObj.removeCallback();
        });
    });
}
// await getDjangoSQL(query, imports);
console.log(await getDjangoSQL(query, imports, {settings: 'settings_postgres'}))
