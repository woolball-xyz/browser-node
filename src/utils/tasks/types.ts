export type TaskType = 'automatic-speech-recognition' | 'text-to-speech' | 'translation' | 'text-generation';

export interface TaskData {
  input: string;
  model: string;
  dtype?: string;
  provider?: 'transformers' | 'webllm' | 'mediapipe';  // Optional provider field to select backend implementation
  [key: string]: any;
}

export type TaskResult = any;

export interface TaskProcessor {
  (data: TaskData): Promise<TaskResult>;
} 