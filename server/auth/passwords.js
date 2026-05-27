import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const scryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
};

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = await scrypt(password, salt, keyLength, scryptOptions);

  return [
    'scrypt',
    String(scryptOptions.N),
    String(scryptOptions.r),
    String(scryptOptions.p),
    salt,
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password, passwordHash) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHash] =
    passwordHash.split('$');

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, 'base64url');
  const derivedKey = await scrypt(password, salt, expectedBuffer.length, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
  });

  return (
    expectedBuffer.length === derivedKey.length &&
    timingSafeEqual(expectedBuffer, derivedKey)
  );
}
