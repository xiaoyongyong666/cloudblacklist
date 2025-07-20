
document.addEventListener('DOMContentLoaded', function () {
    const imageModal = document.getElementById('imageModal');
    const btnImageManager = document.getElementById('btnImageManager');
    const imageList = document.getElementById('imageList');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('imageFile');
    const contentTextarea = document.querySelector('textarea[name="content"]');

    if (btnImageManager) {
        btnImageManager.addEventListener('click', function () {
            imageModal.style.display = 'block';
            loadImages();
        });
    }

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            imageModal.style.display = 'none';
        });
    }

    window.addEventListener('click', function (event) {
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });

    async function loadImages() {
        imageList.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const response = await fetch('/admin/images');
            const images = await response.json();

            if (images.length === 0) {
                imageList.innerHTML = '<div class="no-images">没有可用的图片</div>';
                return;
            }

            imageList.innerHTML = '';
            images.forEach(image => {
                const imgItem = document.createElement('div');
                imgItem.className = 'image-item';
                imgItem.innerHTML = `
          <img src="/uploads/${image}" alt="${image}">
          <div class="image-name">${image}</div>
          <button class="insert-btn" data-filename="${image}">插入</button>
        `;
                imageList.appendChild(imgItem);

                const insertBtn = imgItem.querySelector('.insert-btn');
                insertBtn.addEventListener('click', function () {
                    const filename = this.getAttribute('data-filename');
                    insertImageMarkdown(filename);
                });
            });
        } catch (error) {
            imageList.innerHTML = '<div class="error">无法加载图片</div>';
            console.error('加载图片失败:', error);
        }
    }

    function insertImageMarkdown(filename) {
        const markdown = `<img src="/uploads/${filename}">`;
        const cursorPos = contentTextarea.selectionStart;
        const textBefore = contentTextarea.value.substring(0, cursorPos);
        const textAfter = contentTextarea.value.substring(cursorPos);

        contentTextarea.value = textBefore + markdown + textAfter;
        contentTextarea.focus();
        contentTextarea.setSelectionRange(cursorPos + markdown.length, cursorPos + markdown.length);

        imageModal.style.display = 'none';
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!fileInput.files || fileInput.files.length === 0) {
                alert('请选择图片文件');
                return;
            }

            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            try {
                const response = await fetch('/dext/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    alert('图片上传成功');
                    loadImages();
                    fileInput.value = '';
                } else {
                    alert('图片上传失败');
                }
            } catch (error) {
                console.error('上传错误:', error);
                alert('上传过程中发生错误');
            }
        });
    }
});