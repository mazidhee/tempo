import type { Curriculum, StudySnapshot, StudyTopic, ReviewGrade } from './study';
export type WorkspaceNamespace =
  'focus' | 'plan' | 'journal' | 'review' | 'goals' | 'study' | 'window';

// Modules augment these maps in their own contracts files. Preload remains one
// typed transport; adding a module never exposes Electron or arbitrary channels.
export interface WorkspaceRequests {
  'study:snapshot': { input: undefined; output: StudySnapshot };
  'study:saveCurriculum': {
    input: Pick<Curriculum, 'title' | 'description'> & { id?: string; archived?: boolean };
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
