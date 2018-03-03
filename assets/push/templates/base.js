const utils = {
  getParameter(){
    return JSON.parse(
      decodeURIComponent(atob(location.hash.slice(1)))
    );
  }
};
document.addEventListener('DOMContentLoaded', () => {
  document.getElementsByTagName('footer')[0].innerHTML += `图片生成于 ${new Date().toISOString()}`;
});

