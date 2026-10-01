import { registerStudy } from '../study/module';
import { registerFocus } from '../focus/module';
import type { ModuleRegistration } from './contracts';
export const mainModules: ModuleRegistration[] = [registerStudy, registerFocus];
