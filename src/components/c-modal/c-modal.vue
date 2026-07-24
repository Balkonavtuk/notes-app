<template>
  <dialog ref="dialogRef" class="modal-dialog" @click="onBackdropClick" @close="$emit('close')">
    <div class="modal-content" @click.stop>
      <!-- Шапка модального окна (опционально с крестиком) -->
      <div class="modal-header" v-if="title || showCloseButton">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="close-btn" @click="close" v-if="showCloseButton" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Основное содержимое через слот -->
      <div class="modal-body">
        <slot></slot>
      </div>
    </div>
  </dialog>
</template>

<script>
import { ref, watch, onMounted } from 'vue';

export default {
  name: 'CModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    showCloseButton: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const dialogRef = ref(null);

    // Управление состоянием тега <dialog> через нативные методы showModal() / close()
    watch(() => props.modelValue, (isOpen) => {
      const dialog = dialogRef.value;
      if (!dialog) return;

      if (isOpen) {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        if (dialog.open) {
          dialog.close();
        }
      }
    });

    const close = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    // Закрытие при клике по затемненной области (backdrop)
    const onBackdropClick = (event) => {
      const dialog = dialogRef.value;
      if (!dialog) return;
      
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right
      );

      if (!isInDialog) {
        close();
      }
    };

    onMounted(() => {
      if (props.modelValue && dialogRef.value && !dialogRef.value.open) {
        dialogRef.value.showModal();
      }
    });

    return {
      dialogRef,
      close,
      onBackdropClick
    };
  }
}
</script>

<style scoped>
.modal-dialog {
  padding: 0;
  border: none;
  border-radius: 16px;
  background: #ffffff;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.2s ease-out;
}

@media (max-width: 768px) {
  .modal-dialog {
    max-width: 100%;
    width: 100%;
    margin: 0;
    /* Закрепляем в нижней части экрана на мобильных, как в нативных приложениях */
    position: fixed;
    bottom: 0;
    left: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    max-height: 90vh;
    overflow-y: auto;
  }
}
/* Затемнение фона для нативного dialog */
.modal-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>