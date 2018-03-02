const utils = {
  getParameter(){
    return JSON.parse(
      decodeURIComponent(atob(location.hash.slice(1)))
    );
  }
};
