/**
 * Automated Verification: Admin Media / Cloudinary Upload Pipeline
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('./src/app');
const { knex } = require('./src/db');
const User = require('./src/models/User');
const { hashPassword } = require('./src/utils/password');

let testServer;
let baseUrl;

async function request(method, path, body = null, headers = {}) {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(body);
    const reqHeaders = { ...headers };

    if (body && !isBuffer && typeof body === 'object') {
      body = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
    }

    if (body) {
      reqHeaders['Content-Length'] = isBuffer ? body.length : Buffer.byteLength(body);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function buildMultipartBody(boundary, fields, fileField) {
  const parts = [];

  // Add text fields
  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
      )
    );
  }

  // Add file field
  if (fileField) {
    const { name, filename, contentType, content } = fileField;
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
      )
    );
    parts.push(content);
    parts.push(Buffer.from('\r\n'));
  }

  // End boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return Buffer.concat(parts);
}

async function runTests() {
  console.log('====================================================');
  console.log('ADMIN MEDIA & CLOUDINARY UPLOAD PIPELINE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;
  let testAdminUser = null;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Start test server
    await new Promise((resolve) => {
      testServer = app.listen(0, () => {
        const port = testServer.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`Upload test server running at ${baseUrl}\n`);
        resolve();
      });
    });

    // 1. Create temporary test admin
    console.log('--- 1. Admin Authentication ---');
    const uniqueId = Date.now();
    const testPassword = 'Password@UploadTest123';
    const hashedPassword = await hashPassword(testPassword);
    const adminEmail = `admin_upload_${uniqueId}@example.com`;

    testAdminUser = await User.query().insert({
      name: 'Upload Test Admin',
      email: adminEmail,
      phone: '9876500099',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    const loginRes = await request('POST', '/api/v1/auth/login', {
      email: adminEmail,
      password: testPassword,
    });

    assert(loginRes.status === 200, 'Admin login succeeded (HTTP 200)');
    const token = loginRes.body?.data?.accessToken;
    assert(Boolean(token), 'Admin access token received');

    // 2. Reject unauthorized upload
    console.log('\n--- 2. Unauthorized Access Protection ---');
    const boundary = '----WebKitFormBoundaryTest123';
    const fakeImageBuffer = Buffer.from(
      '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4'
    );

    const multipartData = buildMultipartBody(
      boundary,
      { folder: 'test_folder' },
      {
        name: 'file',
        filename: 'sample_product.png',
        contentType: 'image/png',
        content: fakeImageBuffer,
      }
    );

    const unauthRes = await request('POST', '/api/v1/admin/uploads', multipartData, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    });
    assert(unauthRes.status === 401, 'Upload without token rejected (HTTP 401)');

    // 3. Reject missing file
    console.log('\n--- 3. Validation: Missing File ---');
    const emptyMultipart = buildMultipartBody(boundary, { folder: 'products' }, null);
    const noFileRes = await request('POST', '/api/v1/admin/uploads', emptyMultipart, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`,
    });
    assert(noFileRes.status === 400, 'Upload without file rejected (HTTP 400)');
    assert(noFileRes.body?.code === 'FILE_REQUIRED', 'Error code is FILE_REQUIRED');

    // 4. Reject invalid MIME type
    console.log('\n--- 4. Validation: Invalid File Type ---');
    const textBuffer = Buffer.from('hello plain text script');
    const badFileMultipart = buildMultipartBody(
      boundary,
      { folder: 'products' },
      {
        name: 'file',
        filename: 'malicious_script.txt',
        contentType: 'text/plain',
        content: textBuffer,
      }
    );
    const badTypeRes = await request('POST', '/api/v1/admin/uploads', badFileMultipart, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`,
    });
    assert(badTypeRes.status === 400, 'Invalid file extension/MIME rejected (HTTP 400)');
    assert(badTypeRes.body?.code === 'INVALID_FILE_TYPE', 'Error code is INVALID_FILE_TYPE');

    // 5. Successful Image Upload
    console.log('\n--- 5. Valid Image Upload Pipeline ---');
    const uploadRes = await request('POST', '/api/v1/admin/uploads', multipartData, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`,
    });

    assert(uploadRes.status === 201, 'Image upload succeeded (HTTP 201)');
    assert(uploadRes.body?.success === true, 'Response success is true');
    assert(Boolean(uploadRes.body?.data?.url), `Asset URL returned (${uploadRes.body?.data?.url})`);
    assert(
      Boolean(uploadRes.body?.data?.secure_url),
      `Secure URL returned (${uploadRes.body?.data?.secure_url})`
    );
    assert(
      Boolean(uploadRes.body?.data?.public_id),
      `Public ID returned (${uploadRes.body?.data?.public_id})`
    );
    assert(
      uploadRes.body?.data?.format === 'png',
      `Correct format detected (${uploadRes.body?.data?.format})`
    );
    assert(
      uploadRes.body?.data?.original_filename === 'sample_product.png',
      `Original filename preserved (${uploadRes.body?.data?.original_filename})`
    );

    // 6. Test Alias endpoint /media/upload
    console.log('\n--- 6. Media Upload Alias Endpoint ---');
    const aliasRes = await request('POST', '/api/v1/admin/media/upload', multipartData, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`,
    });
    assert(aliasRes.status === 201, '/admin/media/upload alias succeeded (HTTP 201)');
    assert(Boolean(aliasRes.body?.data?.public_id), 'Alias returned public_id');

    // 7. Verify static access if stored locally
    if (uploadRes.body?.data?.storage === 'local') {
      console.log('\n--- 7. Static Upload Serving ---');
      const staticUrl = new URL(uploadRes.body.data.url);
      const staticRes = await request('GET', staticUrl.pathname);
      assert(staticRes.status === 200, `Static file fetch returned HTTP 200 from ${staticUrl.pathname}`);
    }

    // Clean up created files in test
    const uploadsDir = path.resolve(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.includes('test_folder') || file.includes('sample_product')) {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('[UNEXPECTED ERROR]:', err);
    failed++;
  } finally {
    if (testAdminUser) {
      await User.query().deleteById(testAdminUser.id);
    }
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    await knex.destroy();
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
