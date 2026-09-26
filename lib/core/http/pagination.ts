// Types retained for the existing frontend API client.
export type KeysetCursor = {
  timestamp: string;
  id: string;
};

export type PageRequest = {
  limit: number;
  cursor: KeysetCursor | null;
};
