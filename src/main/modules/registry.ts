import { registerStudy } from '../study/module';
import type { ModuleRegistration } from './contracts';
export const mainModules: ModuleRegistration[] = [registerStudy];
