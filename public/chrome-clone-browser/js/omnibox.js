/**
 * إدارة شريط العنوان (Omnibox)
 */
export class OmniboxController {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.onSubmit = options.onSubmit || (() => {});
    this.init();
  }

  init() {
    if (!this.input) return;
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.onSubmit(this.input.value);
        this.input.blur();
      }
    });
  }

  setValue(val) {
    if (this.input) this.input.value = val;
  }

  getValue() {
    return this.input ? this.input.value : '';
  }

  focus() {
    if (this.input) this.input.focus();
  }
}
