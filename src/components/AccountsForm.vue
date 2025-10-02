<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useAccountsStore} from '../stores/accounts';

import type { Account } from '../types/form';

import { typeOptions } from '../constants/form';

import { v4 as uuidv4 } from 'uuid';

const store = useAccountsStore();

const { add, remove, update } = store
const { accounts } = storeToRefs(store)

const showPass = ref<Record<string, boolean>>({})

const localMap = reactive<Record<string, Account>>({});
const validationErrors = reactive<Record<string, { tags?: boolean; login?: boolean; password?: boolean }>>({});

const changePassVisibility = (id: string) => {
  showPass.value[id] = !showPass.value[id]
}

function ensureLocal() {
for (const a of accounts.value) {
  if (!localMap[a.id]) {
    localMap[a.id] = { ...a };
  } else {
    const cur = localMap[a.id] as Account;
    
    cur.tags = a.tags;
    cur.tagsRaw = a.tagsRaw ?? a.tags.map(t => t.text).join(';');
    cur.type = a.type;
    cur.login = a.login;
    cur.password = a.password;
  }
    if (!validationErrors[a.id]) validationErrors[a.id] = {};
  }

  for (const id in localMap) {
    if (!accounts.value.find(x => x.id === id)) {
      delete localMap[id];
      delete validationErrors[id];
    }
  }
}

watch(
  () => accounts,
  () => {
    ensureLocal();
  },
  { deep: true, immediate: true }
);

function parseTags(raw: string) {
  if (!raw) return [];

  return raw
  .split(';')
  .map(s => s.trim())
  .filter(Boolean)
  .map(text => ({ text }));
}

function validate(account: Account) {
  const errs: { tags?: boolean; login?: boolean; password?: boolean } = {};

  if (!account.login || account.login.trim().length === 0 || account.login.length > 100) errs.login = true;

  if (account.tagsRaw && account.tagsRaw.length > 50) errs.tags = true;

  if (account.type === 'Local') {
    if (!account.password || account.password.length === 0 || account.password.length > 100) errs.password = true;
  }

  return errs;
}


function commitAccount(id: string) {
  const local = localMap[id];
  if (!local) return;

  const toSave: Account = {
    ...local,
    tags: parseTags(local.tagsRaw),
    password: local.type === 'LDAP' ? null : local.password,
  };

  const errs = validate(local);

  validationErrors[id] = errs;

  const hasError = Object.keys(errs).length > 0;

  if (!hasError) {
    toSave.tagsRaw = local.tagsRaw;
    update(toSave);
  }
}

function onAdd() {
  const id = uuidv4();

  const newAcct: Account = {
    id,
    tags: [],
    tagsRaw: '',
    type: 'LDAP',
    login: '',
    password: null,
  };

  add(newAcct);

  localMap[id] = { ...newAcct };
  validationErrors[id] = {};
}


function onRemove(id: string) {
  remove(id);
  delete localMap[id];
  delete validationErrors[id];
}

function onTypeChange(id: string, val: string) {
  const local = localMap[id];

  if (!local) return;

  local.type = val as Account['type'];

  if (local.type === 'LDAP') local.password = null;
  
  commitAccount(id);
}


function onBlur(id: string) {
  commitAccount(id);
}
</script>

<template>
  <v-card class="pa-4">
    <div class="d-flex justify-space-between align-center mb-3">
      <h2>Учетные записи</h2>
      <v-btn
        color="primary"
        variant="outlined"
        @click="onAdd"
      >
        +
      </v-btn>
    </div>

    <v-alert
      type="info"
      variant="tonal"
      class="mb-4"
      density="compact"
      border="start"
    >
      Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;
    </v-alert>

    <v-row
      v-for="acct in accounts"
      :key="acct.id"
      class="mb-2"
      align="center"
    >
      <v-col cols="3">
        <v-text-field
          v-model="localMap[acct.id].tagsRaw"
          density="comfortable"
          variant="outlined"
          label="Метки"
          maxlength="50"
          counter
          :error="validationErrors[acct.id]?.tags"
          @blur="onBlur(acct.id)"
        />
      </v-col>

      <v-col cols="2">
        <v-select
          v-model="localMap[acct.id].type"
          density="comfortable"
          variant="outlined"
          label="Тип записи"
          :items="typeOptions"
          item-title="title"
          item-value="value"
          @update:model-value="onTypeChange(acct.id, localMap[acct.id].type)"
        />
      </v-col>

      <v-col cols="3">
        <v-text-field
          v-model="localMap[acct.id].login"
          density="comfortable"
          variant="outlined"
          label="Логин"
          maxlength="100"
          :error="validationErrors[acct.id]?.login"
          @blur="onBlur(acct.id)"
        />
      </v-col>

      <v-col
        v-if="localMap[acct.id].type === 'Local'"
        cols="3"
      >
        <v-text-field
          v-model="localMap[acct.id].password"
          :append-icon="showPass[acct.id] ? 'mdi-eye' : 'mdi-eye-off'"
          density="comfortable"
          variant="outlined"
          label="Пароль"
          :type="showPass[acct.id] ? 'text' : 'password'"
          @blur="onBlur(acct.id)"
          @click:append="changePassVisibility(acct.id)"
        />
      </v-col>

      <v-col
        cols="1"
        class="d-flex justify-center"
      >
        <v-btn
          icon
          color="error"
          variant="text"
          @click="onRemove(acct.id)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  
    <div
      v-if="accounts.length === 0"
      class="text-grey text-caption pa-4"
    >
      Список пуст — добавьте учетную запись
    </div>
  </v-card>
</template>

<style scoped>
.text-grey { color: rgba(0,0,0,0.6) }
</style>