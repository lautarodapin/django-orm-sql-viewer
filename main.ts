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
from django.conf import settings
settings.configure()
django.setup()

${imports}
import sys
from io import StringIO

original_stdout = sys.stdout
sys.stdout = buffer = StringIO()

${query}

sys.stdout = original_stdout
print(buffer.getvalue())
`;

tmp.setGracefulCleanup();
tmp.file({ postfix: '.py' }, (err, tmpPath, fd, cleanupCallback) => {
  if (err) {
    console.error('Error creating temporary file:', err);
    return;
  }

  fs.writeFileSync(tmpPath, pythonScript);

  const child = spawn('python3.12', [tmpPath], {});

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