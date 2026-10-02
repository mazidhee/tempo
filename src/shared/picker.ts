import type { StudySnapshot } from './study';
export interface PickerOption {
  value: string;
  label: string;
  description?: string;
  group: string;
  groupLabel: string;
}
export const pickerPageSize = 30;
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
/** Search the full collection; only the current page is mounted by the view. */
export function searchOptions(options: PickerOption[], query: string, group = '') {
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return options.filter((option) => {
    if (group && option.group !== group) return false;
    const haystack = normalize(`${option.label} ${option.description || ''} ${option.groupLabel}`);
    return words.every((word) => haystack.includes(word));
  });
}
export function studyOptions(study: StudySnapshot): PickerOption[] {
  const curricula = new Map(study.curricula.filter((c) => !c.archived).map((c) => [c.id, c.title]));
  const topics = new Map(study.topics.map((t) => [t.id, t]));
  return study.topics
    .filter((t) => !t.archived && curricula.has(t.curriculumId))
    .map((topic) => {
      const parents: string[] = [];
      const seen = new Set([topic.id]);
      let parent = topic.parentId ? topics.get(topic.parentId) : undefined;
      while (parent && !seen.has(parent.id)) {
        seen.add(parent.id);
        parents.unshift(parent.title);
        parent = parent.parentId ? topics.get(parent.parentId) : undefined;
      }
      return {
        value: `study:${topic.id}`,
        label: topic.title,
        group: topic.curriculumId,
        groupLabel: curricula.get(topic.curriculumId)!,
        description: [curricula.get(topic.curriculumId), ...parents].join(' › '),
      };
    });
}
