import { validateUsername } from './username';
import { validatePhone } from './phone';

export const isValidEmail = (email: string) => {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return reg.test(email);
};

export { validateUsername, validatePhone };
