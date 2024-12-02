document.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      fetch(href, { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(response => {
          if (response.status === 401) {
            alert('You need to log in to access this feature.');
            window.location.href = '/login?returnTo=' + encodeURIComponent(href);
          } else {
            window.location.href = href;
          }
        })
        .catch(error => console.error('Error:', error));
      e.preventDefault();
    });
  });
  