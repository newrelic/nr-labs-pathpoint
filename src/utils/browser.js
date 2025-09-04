export const isSameOriginAsParent = () => {
  try {
    if (window.parent && window.parent !== window) {
      return window.location.origin === window.parent.location.origin;
    } else {
      return true;
    }
  } catch (e) {
    return false;
  }
};

export const getOrigin = () => {
  const url = isSameOriginAsParent()
    ? document.location.href
    : document.referrer;
  return url ? new URL(url).origin : '';
};
