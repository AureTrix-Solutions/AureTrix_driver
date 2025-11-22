<template>
  <div class="modal-backdrop" @click.self="onCancel">
    <div class="modal-content">
      <h2 class="modal-title">⚠️ Factory Reset</h2>
      <p class="modal-message">
        This will restore your keyboard to factory settings and <strong>delete all your custom configurations</strong>, including:
      </p>
      <ul class="modal-list">
        <li>Key mappings and macros</li>
        <li>RGB lighting settings</li>
        <li>Performance settings and calibration</li>
        <li>All saved profiles</li>
      </ul>
      <p class="modal-warning">
        <strong>We strongly recommend exporting your profiles first!</strong>
      </p>
      <div class="modal-buttons">
        <button class="cancel-btn" @click="onCancel">Cancel</button>
        <button class="ok-btn" @click="onConfirm">OK, Reset</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FactoryResetModal',
  emits: ['confirm', 'cancel'],
  methods: {
    onConfirm() {
      this.$emit('confirm');
    },
    onCancel() {
      this.$emit('cancel');
    }
  }
});
</script>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1e1e1e;
  border: 1px solid #00ffff;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
}

.modal-title {
  color: #ff4444;
  font-size: 24px;
  margin: 0 0 20px 0;
  text-align: center;
}

.modal-message {
  color: #e0e0e0;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 15px;
}

.modal-list {
  color: #e0e0e0;
  margin: 15px 0 15px 20px;
  
  li {
    margin-bottom: 8px;
  }
}

.modal-warning {
  color: #ffaa00;
  font-size: 16px;
  margin: 20px 0;
  text-align: center;
}

.modal-buttons {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.cancel-btn,
.ok-btn {
  flex: 1;
  padding: 12px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #444;
  color: #fff;
  
  &:hover {
    background: #555;
  }
}

.ok-btn {
  background: #ff4444;
  color: #fff;
  
  &:hover {
    background: #ff6666;
  }
}
</style>
