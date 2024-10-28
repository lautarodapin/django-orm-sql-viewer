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

const pythonScript = `
import django

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
from django.conf import settings

django.setup()

${imports}
import sys
from io import StringIO

original_stdout = sys.stdout
sys.stdout = buffer = StringIO()

${query}

print(User.objects.all().query.sql_with_params())

sys.stdout = original_stdout
print(buffer.getvalue())
`;

tmp.setGracefulCleanup();
tmp.file({ postfix: '.py' }, (err, tmpFile, fd, cleanupCallback) => {
    if (err) {
        console.error('Error creating temporary file:', err);
        return;
    }
    console.log('Temporary file:', tmpFile);
    let tempPath = tmpFile.split('/');
    tempPath.pop();
    tempPath = tempPath.join('/');

    fs.cpSync(path.join(__dirname, 'django_project'), tempPath + '/django_project', { recursive: true });

    fs.writeFileSync(tmpFile, pythonScript);

    const child = spawn('python3.12', [tmpFile], {});

    let output = '';
    child.stdout.on('data', (data) => {
        output += data.toString();
    });

    child.stderr.on('data', (data) => {
        console.error(`Error getting SQL: ${data.toString()}`);
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log(output.trim());
        } else {
            console.error(`Error getting SQL (code ${code})`);
        }

        cleanupCallback();
    });
});
