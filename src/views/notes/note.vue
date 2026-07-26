<template>
  <article class="note-card" :class="`view-${viewType}`">
    
    <!-- Изображение для режима СПИСКА (слева) -->
    <!-- Используем v-if="hasValidImage", чтобы скрыть блок, если картинка битая -->
    <div class="note-image-box list-image" v-if="hasValidImage">
      <img :src="imageUrl" :alt="note.title" @error="handleImageError" />
    </div>

    <div class="note-body">
      <header class="note-header">
        <div class="note-meta">
          <span class="note-date mobile-date">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {{ formattedDate }}
          </span>
          <span class="note-id">#{{ note.id }}</span>
        </div>

        <div class="note-actions desktop-actions">
          <button class="btn-icon" @click.stop="$emit('edit', note)" title="Редактировать">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="btn-icon" @click.stop="$emit('delete', note.id)" title="Удалить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
            </svg>
          </button>
        </div>
      </header>

      <h3 class="note-title">{{ note.title }}</h3>

      <!-- Отформатированный текст заметки -->
      <div class="note-text" v-html="formattedText"></div>

      <!-- Изображение для режима ПЛИТКИ и МОБИЛОК (внутри контента) -->
      <div class="note-image-box inline-image" v-if="hasValidImage">
        <img :src="imageUrl" :alt="note.title" @error="handleImageError" />
      </div>

      <footer class="note-footer">
        <span class="note-date desktop-date">{{ formattedDate }}</span>

        <div class="note-actions mobile-actions">
          <button class="btn-icon delete-btn" @click.stop="$emit('delete', note.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
            </svg>
          </button>
          <button class="btn-icon edit-btn" @click.stop="$emit('edit', note)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  </article>
</template>

<script>
import { computed, ref } from 'vue';

export default {
  name: 'NoteCard',
  props: {
    note: {
      type: Object,
      required: true
    },
    viewType: {
      type: String,
      default: 'grid'
    }
  },
  emits: ['edit', 'delete'],
  setup(props) {
    // --- 1. Работа с изображениями ---
    const isImageBroken = ref(false);

    // Событие @error на теге <img> сработает, если сервер вернет 404
    const handleImageError = () => {
      isImageBroken.value = true;
    };

    // Подставляем хост бэкенда, если путь относительный
    const imageUrl = computed(() => {
      if (!props.note.image) return '';
      
      const imgPath = props.note.image;
      if (imgPath.startsWith('http') || imgPath.startsWith('data:')) {
        return imgPath; // Если путь уже полный, возвращаем как есть
      }
      
      const baseUrl = 'http://127.0.0.1:5000';
      // Склеиваем слэши корректно
      return `${baseUrl}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
    });

    const hasValidImage = computed(() => {
      return props.note.image && !isImageBroken.value;
    });

    // --- 2. Работа с датой ---
    const formattedDate = computed(() => {
      if (!props.note.date) return '';
      const date = new Date(props.note.date);
      if (isNaN(date)) return props.note.date;
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    });

    // --- 3. Работа с текстом ---
    const escapeHtml = (text) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    const formattedText = computed(() => {
      if (!props.note.text) return '';
      
      let safeText = escapeHtml(props.note.text);
      
      // Заменяем строковые литералы (если с бэкенда приходит текст "\n")
      // и нативные переносы строк от textarea на <br>
      safeText = safeText
        .replace(/\\r\\n/g, '<br>')
        .replace(/\\n/g, '<br>')
        .replace(/\\r/g, '<br>')
        .replace(/\n/g, '<br>') 
        .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      
      // Заменяем гиперссылки
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      safeText = safeText.replace(urlRegex, '<a href="$1" target="_blank" class="note-link">$1</a>');
      
      return safeText;
    });

    return {
      formattedDate,
      formattedText,
      imageUrl,
      hasValidImage,
      handleImageError
    };
  }
}
</script>

<style scoped>
/* =======================================
   БАЗОВЫЕ СТИЛИ (ОБЩИЕ)
   ======================================= */
.note-card {
  background-color: #EAE6F0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 24px;
  transition: all 0.3s ease;
}

.note-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 16px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #111827;
  font-weight: 700;
}

.note-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* 
  ОБРАБОТКА ТЕКСТА
  white-space: pre-wrap сохраняет \n, \r и \t нативно! 
*/
.note-text {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
  white-space: pre-wrap; 
  tab-size: 4;
  word-break: break-word;
}

/* Стилизация ссылок (через :deep, так как они рендерятся через v-html) */
:deep(.note-link) {
  color: #ffffff;
  background-color: #7c3aed;
  text-decoration: none;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  transition: opacity 0.2s;
}

:deep(.note-link:hover) {
  opacity: 0.85;
}

.note-image-box {
  border-radius: 12px;
  overflow: hidden;
}

.note-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.note-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.note-date {
  font-size: 12px;
  color: #6b7280;
}

/* Кнопки действий */
.note-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #111827;
}

.mobile-actions, 
.mobile-date {
  display: none;
}

/* =======================================
   РЕЖИМ: ПЛИТКА (GRID)
   ======================================= */
.view-grid {
  flex-direction: column;
  gap: 16px;
}

.view-grid .list-image {
  display: none;
}

.view-grid .inline-image {
  display: block;
  max-height: 220px;
}

/* =======================================
   РЕЖИМ: СПИСОК (LIST)
   ======================================= */
.view-list {
  flex-direction: row;
  align-items: stretch;
}

.view-list .list-image {
  display: block;
  width: 180px;
  flex-shrink: 0;
}

.view-list .inline-image {
  display: none;
}

.view-list .desktop-date {
  margin-left: auto; /* Прибиваем дату к правому нижнему краю */
}

/* =======================================
   АДАПТИВНОСТЬ (МОБИЛЬНЫЕ УСТРОЙСТВА)
   ======================================= */
@media (max-width: 640px) {
  /* Независимо от viewType, на мобильных всегда отображается одной колонкой */
  .note-card.view-grid,
  .note-card.view-list {
    flex-direction: column;
    gap: 16px;
  }
  
  .list-image { display: none !important; }
  .inline-image { display: block !important; max-height: 200px; }

  /* Перестановка элементов шапки и футера */
  .desktop-actions, .desktop-date { display: none !important; }
  .mobile-actions, .mobile-date { display: flex !important; }

  .note-meta {
    width: 100%;
    justify-content: space-between;
    flex-direction: row-reverse; /* ID справа, Дата слева */
    color: #6b7280;
    font-size: 14px;
  }
  
  .mobile-date {
    align-items: center;
    gap: 6px;
  }

  .note-footer {
    margin-top: 8px;
    justify-content: flex-end;
  }

  /* Стилизация мобильных кнопок действий */
  .mobile-actions .btn-icon {
    border: none;
    border-radius: 12px;
    width: 40px;
    height: 40px;
  }

  .mobile-actions .edit-btn {
    background: #7c3aed;
    color: white;
  }

  .mobile-actions .delete-btn {
    background: #e5e7eb;
    color: #374151;
  }
}
</style>