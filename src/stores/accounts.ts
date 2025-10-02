import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Account } from '../types/form';

const STORAGE_KEY = 'accounts_store_v1';

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([]);

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) accounts.value = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load accounts', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value));
    } catch (e) {
      console.error('Failed to save accounts', e);
    }
  }

  function add(account: Account) {
    accounts.value.push(account);
    save();
  }

  function update(updated: Account) {
    const idx = accounts.value.findIndex(a => a.id === updated.id);
    if (idx >= 0) {
      accounts.value.splice(idx, 1, updated);
      save();
    }
  }

  function remove(id: string) {
    accounts.value = accounts.value.filter(a => a.id !== id);
    save();
  }

  load();

  return {
    accounts,
    add,
    update,
    remove,
    load,
    save
  };
});
