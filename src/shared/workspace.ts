import type { Curriculum, StudySnapshot, StudyTopic, ReviewGrade } from './study';
import type { StudyOutlineInput } from './studyImport';
export type WorkspaceNamespace =
      'focus' | 'plan' | 'journal' | 'review' | 'goals' | 'study' | 'window' | 'backup';

// Modules augment these maps in their own contracts files. Preload remains one
// typed transport; adding a module never exposes Electron or arbitrary channels.
export interface WorkspaceRequests {
  'backup:status': {input:undefined;output:import('./backup').BackupStatus};
  'backup:local': {input:undefined;output:import('./backup').BackupStatus['local']};
  'backup:readLocal': {input:string;output:import('./backup').BackupPreview};
  'backup:configure': {input:{repository:string;token?:string};output:boolean};
  'backup:upload': {input:string;output:{path:string;commit:string;repository:string;branch:string}};
  'backup:decrypt': {input:{content:string;password:string};output:import('./backup').BackupPreview};
  'study:importOutlines': { input: StudyOutlineInput[]; output: Curriculum[] };
  'study:snapshot': { input: undefined; output: StudySnapshot };
  'study:saveCurriculum': {
    input: Pick<Curriculum, 'title' | 'description'> & Partial<Pick<Curriculum, 'id' | 'archived' | 'studyFocus' | 'focusUntil' | 'currentTopicId' | 'coverImage'>>;
    output: Curriculum;
  };
  'study:saveTopic': {
    input: Pick<StudyTopic, 'title' | 'curriculumId'> &
      Partial<Pick<StudyTopic, 'id' | 'parentId' | 'order' | 'archived'>>;
    output: StudyTopic;
  };
  'study:learn': { input: { id: string; learned: boolean }; output: StudyTopic };
  'study:grade': { input: { id: string; grade: ReviewGrade }; output: StudyTopic };
  'study:deleteTopic': { input: string; output: boolean };
  'window:control': { input: 'minimize' | 'maximize' | 'close'; output: void };
}
export interface WorkspaceEvents {
  'study:changed': StudySnapshot;
}
export interface WorkspaceAPI {
  invoke<K extends keyof WorkspaceRequests>(
    channel: K,
    ...args: WorkspaceRequests[K]['input'] extends undefined
      ? [] | [undefined]
      : [WorkspaceRequests[K]['input']]
  ): Promise<WorkspaceRequests[K]['output']>;
  on<K extends keyof WorkspaceEvents>(
    channel: K,
    listener: (payload: WorkspaceEvents[K]) => void,
  ): () => void;
}
declare global {
  interface Window {
    workspaceAPI: WorkspaceAPI;
  }
}
