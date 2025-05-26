import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Генерирует Access Token (короткоживущий)
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  if (!secret) {
    throw new Error('JWT_SECRET не установлен в переменных окружения');
  }

  // Используем any для обхода проблем с типизацией
  return jwt.sign(payload, secret, { expiresIn } as any);
};

/**
 * Генерирует Refresh Token (долгоживущий)
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET не установлен в переменных окружения');
  }

  // Используем any для обхода проблем с типизацией
  return jwt.sign(payload, secret, { expiresIn } as any);
};

/**
 * Генерирует пару токенов
 */
export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

/**
 * Верифицирует Access Token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET не установлен в переменных окружения');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  } catch (error) {
    throw new Error('Недействительный токен доступа');
  }
};

/**
 * Верифицирует Refresh Token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET не установлен в переменных окружения');
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  } catch (error) {
    throw new Error('Недействительный refresh токен');
  }
};

/**
 * Извлекает токен из заголовка Authorization
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return null;
  }

  return token;
};
