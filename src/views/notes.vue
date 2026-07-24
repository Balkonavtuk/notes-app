<template>
  <div class="notes-app">
    <!-- Хэдер -->
    <header class="header">
      <div class="logo">Notes</div>
      
      <div class="search-container">
        <div class="search-box">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <!-- Привязываем инпут к searchQuery -->
          <input 
            type="text" 
            placeholder="Поиск" 
            v-model="searchQuery"
          />
        </div>
      </div>

      <button class="btn btn-archive">
        <svg class="icon archive-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
        <span>Архив</span>
      </button>
    </header>

    <!-- Основной контент -->
    <main class="main-content">
      <!-- Панель управления видом -->
      <div class="view-controls">
        <button 
          class="view-btn" 
          :class="{ active: currentView === 'grid' }"
          @click="currentView = 'grid'"
          aria-label="Вид плиткой"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>
        
        <button 
          class="view-btn" 
          :class="{ active: currentView === 'list' }"
          @click="currentView = 'list'"
          aria-label="Вид списком"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
      </div>

<!-- Состояние пустого списка -->
      <div v-if="notes.length === 0 && !isLoading" class="empty-state">
        <p>История поиска отсутствует</p>
      </div>

      <!-- Список заметок (в будущем здесь будет вывод карточек) -->
      <div class="notes-list" v-else>
        <!-- Вывод списка -->
      </div>

      <!-- Триггер и компонент прелоадера для IntersectionObserver -->
      <Loader v-if="isLoading" />
      <div ref="observerTrigger" class="observer-trigger"></div>

      <!-- Кнопка добавления -->
      <button class="btn-fab" @click="isModalOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <!-- Подключаем c-modal -->
      <CModal v-model="isModalOpen" :showCloseButton="true">
        <CNoteEditForm 
          :note="currentEditingNote" 
          :isLoading="isSaving"
          @submit="handleSaveNote" 
          @cancel="closeModal" 
        />
      </CModal>
    </main>

    <!-- Футер -->
    <footer class="footer">
      <div class="footer-stats">
        Всего заметок: {{ notes.length }}
      </div>
      <div class="footer-user">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>notes-app@Kondakova D.D.</span>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRequest } from '@/composables/request';
import { useDebounceFn } from '@/composables/useDebounceFn';
import Loader from '@/components/Loader.vue';
import CModal from '@/components/c-modal/c-modal.vue';
import CNoteEditForm from '@/components/c-note-edit-form/c-note-edit-form.vue';

export default {
  name: 'Notes',
  components: {
    Loader, CModal, CNoteEditForm
  },
  setup() {
    const currentView = ref('grid');
    const notes = ref([]);
    
    const currentEditingNote = ref(null); // Сюда положим заметку, если будем её редактировать

    const isModalOpen = ref(false);
    const noteTitle = ref('');
    const noteText = ref('');
    const isSaving = ref(false);

    const openCreateModal = () => {
      currentEditingNote.value = null; // Сбрасываем данные
      isModalOpen.value = true;        // Открываем окно
    };

    const openEditModal = (note) => {
      currentEditingNote.value = note; // Передаем объект заметки в форму
      isModalOpen.value = true;        // Открываем окно
    };
    const closeModal = () => {
      isModalOpen.value = false;
      currentEditingNote.value = null;
    };
    const saveNote = () => {
      // Логика сохранения заметки
      isModalOpen.value = false;
    };

    const page = ref(1);
    const searchQuery = ref('');
    const observerTrigger = ref(null);
    let observer = null;

    const fetchNotes = async () => {
      const queryParams = {
        page: page.value,
        search: searchQuery.value,
        limit: 20
      };

      const currentRequest = useRequest('http://127.0.0.1:5000/notes', {
        method: 'GET',
        query: queryParams
      });

      await currentRequest.request();

      if (currentRequest.isLoaded.value && currentRequest.data.value) {
        // Берем массив напрямую из ключа notes (или пустой массив, если что-то пошло не так)
        const newItems = currentRequest.data.value.notes || [];
        
        notes.value = [...notes.value, ...newItems];
      }
    };
      const handleSaveNote = async (formData) => {
        isSaving.value = true;

        try {
          const submitData = new FormData();
          
          // 1. Обязательный title
          submitData.append('title', formData.title);
          
          // 2. Строго 'test', как того требует спецификация API бэкенда
          submitData.append('text', formData.text); 
          
          // 3. Обязательный image (отправляем файл, либо пустую строку/null, чтобы ключ присутствовал)
          if (formData.file) {
            submitData.append('image', formData.file);
          } else {
            // Отправляем пустой файл-заглушку, чтобы бэкенд не падал при поиске stream
            submitData.append('image', new File([""], "empty.png", { type: "image/png" }));
          }

          const isEdit = !!formData.id;
          const url = isEdit 
            ? `http://127.0.0.1:5000/notes/${formData.id}` 
            : 'http://127.0.0.1:5000/notes';
          const method = isEdit ? 'PATCH' : 'POST';

          const saveRequest = useRequest(url, {
            method: method,
            body: submitData
          });

          await saveRequest.request();

          if (saveRequest.isLoaded.value) {
            closeModal();
            page.value = 1;
            notes.value = [];
            await fetchNotes();
          } else {
            // Выводим точную ошибку бэкенда в консоль
            console.error('Ошибка при сохранении:', saveRequest.error.value);
          }
        } finally {
          isSaving.value = false;
        }
      };
    // Создаем дебаунс-версию функции поиска с задержкой 250мс
    const debouncedSearch = useDebounceFn(async () => {
      page.value = 1;
      notes.value = [];
      await fetchNotes();
    }, 250);

    // Следим за изменением строки поиска и вызываем дебаунс
    watch(searchQuery, () => {
      debouncedSearch();
    });

    onMounted(async () => {
      await fetchNotes();

      observer = new IntersectionObserver(async ([entry]) => {
        // isLoading здесь можно вытащить из хука запроса при необходимости, 
        // либо полагаться на стандартное поведение скролла
        if (entry.isIntersecting) {
          page.value += 1;
          await fetchNotes();
        }
      }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      });

      if (observerTrigger.value) {
        observer.observe(observerTrigger.value);
      }
    });

    onUnmounted(() => {
      if (observer) {
        observer.disconnect();
      }
    });

    return {
      currentView,
      notes,
      searchQuery,
      observerTrigger,
      isModalOpen,
      noteTitle,
      noteText,
      saveNote,
      currentEditingNote,
      openCreateModal,
      openEditModal,
      closeModal,
      handleSaveNote,
    };
  }
}
</script>

<style scoped>
/* Базовые стили и переменные */
.observer-trigger {
  height: 10px;
  width: 100%;
}
.notes-app {
  --primary: #7c3aed; /* Фиолетовый цвет кнопок */
  --primary-hover: #6d28d9;
  --primary-light: #c4b5fd; /* Светло-фиолетовый для активной кнопки вида */
  --bg-light: #f5f3ff; /* Светло-фиолетовый фон поиска */
  --text-main: #1e1b4b;
  --text-muted: #6b7280;
  --border-color: #e5e7eb;
  
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-main);
}

/* Иконки */
.icon {
  width: 18px;
  height: 18px;
}

/* ================= ХЭДЕР ================= */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 32px;
  font-weight: 800;
  color: #171124;
  letter-spacing: -0.5px;
}

/* Строка поиска */
.search-container {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 24px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: var(--bg-light);
  border-radius: 24px;
  padding: 8px 16px;
  width: 100%;
  max-width: 600px;
  transition: box-shadow 0.2s;
}

.search-box:hover {
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
}

.search-box .icon {
  color: var(--text-muted);
  margin-right: 8px;
}

.search-box input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  color: var(--text-main);
  outline: none;
}

.search-box input::placeholder {
  color: var(--text-muted);
}

/* Кнопка Архив */
.btn-archive {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
}

.btn-archive .archive-icon {
  display: none; /* Скрыта на десктопе по макету */
}

.btn-archive:hover {
  background-color: var(--primary-hover);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
}

.btn-archive:active {
  transform: scale(0.96);
}

/* ================= ОСНОВНОЙ КОНТЕНТ ================= */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Панель управления видом */
.view-controls {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 32px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: transparent;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn svg {
  width: 20px;
  height: 20px;
}

.view-btn:hover {
  background-color: var(--bg-light);
  border-color: var(--primary-light);
}

.view-btn:active {
  transform: scale(0.95);
}

.view-btn.active {
  background-color: var(--primary-light);
  border-color: var(--primary-light);
}

/* Пустое состояние */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 15px;
}

/* Плавающая кнопка (FAB) */
.btn-fab {
  position: absolute;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.btn-fab svg {
  width: 28px;
  height: 28px;
}

.btn-fab:hover {
  background-color: var(--primary-hover);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
  transform: translateY(-2px);
}

.btn-fab:active {
  transform: translateY(0) scale(0.92);
}

/* ================= ФУТЕР ================= */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: #171124;
}

.footer-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ================= АДАПТИВНОСТЬ (Медиа-запросы) ================= */
@media (max-width: 768px) {
  .header {
    flex-wrap: wrap;
    padding: 16px;
    gap: 16px;
  }

  /* Переносим поиск наверх */
.search-container {
    order: -1;
    flex: 0 0 100%; /* Принудительно задаем ширину 100% для flex-элемента */
    padding: 0;
    margin-bottom: 16px; /* Добавляем отступ между поиском и логотипом */
  }
  
  .search-box {
    max-width: 100%;
    background-color: transparent;
    border: 1px solid var(--primary);
  }

  .logo {
    font-size: 24px;
  }

  /* Адаптация кнопки Архив для мобильных */
  .btn-archive {
    padding: 6px 16px;
    background-color: var(--bg-light);
    color: var(--primary);
  }
  
  .btn-archive:hover {
    background-color: #ddd6fe;
  }

  .btn-archive .archive-icon {
    display: block; /* Показываем иконку на мобильных */
  }
  
  .view-controls {
    padding: 16px;
  }

  .btn-fab {
    bottom: 24px;
    right: 24px;
  }

  .footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    align-items: flex-start;
  }
}
</style>
