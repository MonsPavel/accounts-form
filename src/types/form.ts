export type AccountType = 'LDAP' | 'Local';

export type TagItem = { text: string };

export interface Account {
  id: string;
  tags: TagItem[];
  tagsRaw: string;
  type: AccountType;
  login: string;
  password: string | null;
}

export interface TypeOptions {
  title: string;
  value: string;
}
