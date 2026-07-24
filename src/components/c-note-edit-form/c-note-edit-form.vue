<template>
  <form class="note-edit-form" @submit.prevent="handleSubmit">
    <h2 class="form-title">{{ formTitle }}</h2>

    <!-- Поле заголовка -->
    <div class="form-group" :class="{ 'has-error': titleError }">
      <input 
        type="text" 
        v-model="form.title" 
        placeholder="Заголовок*" 
        maxlength="10"
        class="form-input"
      />
      <span v-if="titleError" class="error-text">{{ titleError }}</span>
    </div>

    <!-- Поле текста заметки -->
    <div class="form-group" :class="{ 'has-error': textError }">
      <textarea 
        v-model="form.text" 
        placeholder="Текст заметки" 
        maxlength="1000"
        class="form-textarea"
      ></textarea>
      <span v-if="textError" class="error-text">{{ textError }}</span>
    </div>

    <!-- Загрузка файла / изображения -->
    <div class="form-group">
      <label class="file-upload-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>{{ fileName || 'Прикрепить изображение' }}</span>
        <input type="file" @change="handleFileChange" accept=".jpeg, .jpg, .png" class="file-input" />
      </label>
      <span v-if="fileError" class="error-text">{{ fileError }}</span>
    </div>

    <!-- Кнопки действий -->
    <div class="form-actions">
      <button 
        type="submit" 
        class="btn btn-save" 
        :disabled="hasErrors || isLoading"
      >
        {{ isLoading ? '...' : 'Сохранить' }}
      </button>
      <button 
        type="button" 
        class="btn btn-cancel" 
        :disabled="isLoading" 
        @click="$emit('cancel')"
      >
        Отменить
      </button>
    </div>
  </form>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'CNoteEditForm',
  props: {
    // Передаем существующую заметку для режима редактирования, либо null/undefined для создания
    note: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const form = ref({
      title: '',
      text: '',
      file: null
    });

    const fileName = ref('');
    const fileError = ref('');

    // Вычисляемый заголовок в зависимости от контекста
    const formTitle = computed(() => {
      return props.note ? 'Редактирование заметки' : 'Новая заметка';
    });

    // Предзаполнение полей при передаче заметки (редактирование)
    watch(() => props.note, (newNote) => {
      if (newNote) {
        form.value.title = newNote.title || '';
        form.value.text = newNote.text || '';
        form.value.file = null;
        fileName.value = '';
        fileError.value = '';
      } else {
        form.value.title = '';
        form.value.text = '';
        form.value.file = null;
        fileName.value = '';
        fileError.value = '';
      }
    }, { immediate: true });

    // Валидация заголовка (строго по ТЗ: не более 10 символов)
    const titleError = computed(() => {
      if (form.value.title.length > 10) {
        return 'Заголовок не должен превышать 10 символов';
      }
      return '';
    });

    // Валидация текста (строго по ТЗ: не более 1000 символов)
    const textError = computed(() => {
      if (form.value.text.length > 1000) {
        return 'Текст не должен превышать 1000 символов';
      }
      return '';
    });

    const hasErrors = computed(() => {
      return !!titleError.value || !!textError.value || !!fileError.value || !form.value.title.trim();
    });

    // Обработка и валидация файла
    const handleFileChange = (event) => {
      const target = event.target;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        fileError.value = '';

        // Проверка формата (.jpeg, .jpg, .png)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          fileError.value = 'Допустимы только форматы .jpeg, .jpg, .png';
          target.value = '';
          return;
        }

        // Проверка размера (не более 1 МБ = 1024 * 1024 байт)
        const maxSize = 1 * 1024 * 1024;
        if (file.size > maxSize) {
          fileError.value = 'Размер файла не должен превышать 1 МБ';
          target.value = '';
          return;
        }

        form.value.file = file;
        fileName.value = file.name;
      }
    };

    const handleSubmit = () => {
      if (hasErrors.value) return;
      
      emit('submit', {
        ...form.value,
        id: props.note ? props.note.id : undefined
      });
    };

    return {
      form,
      fileName,
      fileError,
      formTitle,
      titleError,
      textError,
      hasErrors,
      handleFileChange,
      handleSubmit
    };
  }
}
</script>

<style scoped>
.note-edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #7c3aed;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.file-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  width: fit-content;
  transition: background-color 0.2s;
}

.file-upload-btn:hover {
  background-color: #e5e7eb;
}

.file-input {
  display: none;
}

.error-text {
  font-size: 12px;
  color: #dc2626;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.btn-save {
  background-color: #7c3aed;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn-save:disabled {
  background-color: #c4b5fd;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: transparent;
  color: #7c3aed;
  border: 1px solid #7c3aed;
}

.btn-cancel:hover {
  background-color: #f5f3ff;
}

/* Адаптация для десктопов (расположение кнопок в ряд, если нужно) */
@media (min-width: 740px) {
  .form-actions {
    flex-direction: row-reverse;
  }
}
</style>