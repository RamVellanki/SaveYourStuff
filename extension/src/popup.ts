import { API_URL, USER_ID } from './config';

interface Category {
  id: string;
  name: string;
}

class TagsComponent {
  private tagsInput: HTMLInputElement;
  private selectedTagsContainer: HTMLElement;
  private dropdown: HTMLElement;
  private selectedTags: string[] = [];
  private availableTags: string[] = [];
  private filteredTags: string[] = [];
  private highlightedIndex = -1;

  constructor() {
    this.tagsInput = document.getElementById('tagsInput') as HTMLInputElement;
    this.selectedTagsContainer = document.getElementById('selectedTags') as HTMLElement;
    this.dropdown = document.getElementById('tagsDropdown') as HTMLElement;
    
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    this.tagsInput.addEventListener('input', (e) => this.handleInput(e));
    this.tagsInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.tagsInput.addEventListener('blur', () => this.hideDropdown());
    this.tagsInput.addEventListener('focus', () => this.handleInput(null));
    
    document.addEventListener('click', (e) => {
      if (!this.tagsInput.contains(e.target as Node) && !this.dropdown.contains(e.target as Node)) {
        this.hideDropdown();
      }
    });
  }

  async loadExistingTags() {
    try {
      // Try to load from new tags endpoint first
      const response = await fetch(`${API_URL}/tags`, {
        headers: {
          'x-user-id': USER_ID,
        },
      });
      const result = await response.json();

      if (result.success && result.data) {
        this.availableTags = result.data.map((tag: Category) => tag.name);
      } else {
        // Fallback to categories endpoint for backward compatibility
        const categoryResponse = await fetch(`${API_URL}/categories`, {
          headers: {
            'x-user-id': USER_ID,
          },
        });
        const categoryResult = await categoryResponse.json();

        if (categoryResult.success && categoryResult.data) {
          this.availableTags = categoryResult.data.map((category: Category) => category.name);
        }
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      // Try fallback to categories in case of error
      try {
        const categoryResponse = await fetch(`${API_URL}/categories`, {
          headers: {
            'x-user-id': USER_ID,
          },
        });
        const categoryResult = await categoryResponse.json();

        if (categoryResult.success && categoryResult.data) {
          this.availableTags = categoryResult.data.map((category: Category) => category.name);
        }
      } catch (fallbackError) {
        console.error('Failed to load categories as fallback:', fallbackError);
      }
    }
  }

  private handleInput(e: Event | null) {
    const value = this.tagsInput.value.toLowerCase().trim();
    
    if (value === '') {
      this.hideDropdown();
      return;
    }

    this.filteredTags = this.availableTags.filter(tag => 
      tag.toLowerCase().includes(value) && !this.selectedTags.includes(tag)
    );

    this.updateDropdown(value);
  }

  private updateDropdown(inputValue: string) {
    this.dropdown.innerHTML = '';
    this.highlightedIndex = -1;

    if (this.filteredTags.length > 0) {
      this.filteredTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'tag-suggestion';
        item.textContent = tag;
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.addTag(tag);
        });
        this.dropdown.appendChild(item);
      });
    }

    if (inputValue && !this.availableTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase()) && 
        !this.selectedTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase())) {
      const createItem = document.createElement('div');
      createItem.className = 'tag-suggestion create-new';
      createItem.textContent = `Create "${inputValue}"`;
      createItem.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.addTag(inputValue);
      });
      this.dropdown.appendChild(createItem);
    }

    this.showDropdown();
  }

  private handleKeydown(e: KeyboardEvent) {
    const items = this.dropdown.querySelectorAll('.tag-suggestion');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, items.length - 1);
        this.updateHighlight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        this.updateHighlight();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.highlightedIndex >= 0 && items[this.highlightedIndex]) {
          const text = items[this.highlightedIndex].textContent || '';
          const tagName = text.startsWith('Create "') ? 
            text.slice(8, -1) : text;
          this.addTag(tagName);
        } else {
          const value = this.tagsInput.value.trim();
          if (value) {
            this.addTag(value);
          }
        }
        break;
      case 'Escape':
        this.hideDropdown();
        break;
      case 'Backspace':
        if (this.tagsInput.value === '' && this.selectedTags.length > 0) {
          this.removeTag(this.selectedTags[this.selectedTags.length - 1]);
        }
        break;
      case ',':
      case 'Tab':
        e.preventDefault();
        const value = this.tagsInput.value.trim();
        if (value) {
          this.addTag(value);
        }
        break;
    }
  }

  private updateHighlight() {
    const items = this.dropdown.querySelectorAll('.tag-suggestion');
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.highlightedIndex);
    });
  }

  private addTag(tagName: string) {
    const trimmedTag = tagName.trim();
    if (trimmedTag && !this.selectedTags.includes(trimmedTag)) {
      this.selectedTags.push(trimmedTag);
      this.renderSelectedTags();
      this.tagsInput.value = '';
      this.hideDropdown();
      
      if (!this.availableTags.includes(trimmedTag)) {
        this.availableTags.push(trimmedTag);
      }
    }
  }

  private removeTag(tagName: string) {
    this.selectedTags = this.selectedTags.filter(tag => tag !== tagName);
    this.renderSelectedTags();
  }

  private renderSelectedTags() {
    this.selectedTagsContainer.innerHTML = '';
    this.selectedTags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.innerHTML = `${tag}<span class="tag-remove">×</span>`;
      
      const removeBtn = tagElement.querySelector('.tag-remove') as HTMLElement;
      removeBtn.addEventListener('click', () => this.removeTag(tag));
      
      this.selectedTagsContainer.appendChild(tagElement);
    });
  }

  private showDropdown() {
    if (this.dropdown.children.length > 0) {
      this.dropdown.style.display = 'block';
    }
  }

  private hideDropdown() {
    setTimeout(() => {
      this.dropdown.style.display = 'none';
      this.highlightedIndex = -1;
    }, 150);
  }

  getSelectedTags(): string[] {
    return this.selectedTags;
  }
}

// Prevent multiple initializations using a global flag
if ((window as any).popupInitialized) {
  // Don't add another DOMContentLoaded listener
} else {
  (window as any).popupInitialized = true;

  document.addEventListener('DOMContentLoaded', async () => {
  
  const form = document.getElementById('bookmarkForm') as HTMLFormElement;
  const titleInput = document.getElementById('title') as HTMLInputElement;
  const summaryInput = document.getElementById('summary') as HTMLTextAreaElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const messageDiv = document.getElementById('message') as HTMLDivElement;

  const tagsComponent = new TagsComponent();
  await tagsComponent.loadExistingTags();

  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.title) {
    titleInput.value = tab.title;
  }

  let isSubmitting = false;

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const selectedTags = tagsComponent.getSelectedTags();
      const requestBody: any = {
        url: tab.url,
        title: titleInput.value,
        summary: summaryInput.value || undefined,
      };

      // Send tags array (new system)
      if (selectedTags.length > 0) {
        requestBody.tags = selectedTags;
      }

      const response = await fetch(`${API_URL}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': USER_ID,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        showMessage('Saved successfully!', 'success');
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        showMessage(result.error || 'Failed to save', 'error');
      }
    } catch (error) {
      showMessage('Failed to save', 'error');
      console.error(error);
    } finally {
      isSubmitting = false;
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Your Stuff';
    }
  });

  function showMessage(text: string, type: 'success' | 'error') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
  }
  });
}
