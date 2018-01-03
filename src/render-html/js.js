/* eslint-disable no-alert */

window.onerror = (message, source, line, column, error) => {
  alert(`
Message: ${message}
Source: ${source}
Line: ${line}
Column: ${column}
Error object: ${JSON.stringify(error)}
`);

  return false;
};

const sendMessage = msg => {
  window.postMessage(JSON.stringify(msg), '*');
};

const getMessageNode = node => {
  let curNode = node;
  while (curNode && curNode.parentNode && curNode.parentNode.id !== 'message-list') {
    curNode = curNode.parentNode;
  }
  return curNode;
};

const getMessageIdFromNode = node => {
  const msgNode = getMessageNode(node);
  return msgNode && msgNode.getAttribute('data-msg-id');
};

const scrollToBottom = () => {
  window.scrollTo(0, document.body.scrollHeight);
};

const scrollToBottomIfNearEnd = () => {
  if (document.body.scrollHeight - 100 < document.body.scrollTop + document.body.clientHeight) {
    scrollToBottom();
  }
};

const scrollToAnchor = anchor => {
  const anchorNode = document.getElementById(`msg-${anchor}`);
  if (anchorNode) {
    anchorNode.scrollIntoView(false);
  } else {
    scrollToBottom();
  }
};

let height = document.body.clientHeight;
window.addEventListener('resize', event => {
  const difference = height - document.body.clientHeight;
  if (
    difference > 0 ||
    document.body.scrollHeight !== document.body.scrollTop + document.body.clientHeight
  ) {
    window.scrollBy(0, difference);
  }
  height = document.body.clientHeight;
});

document.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  switch (msg.type) {
    case 'bottom':
      scrollToBottom();
      break;
    case 'content':
      document.getElementById('message-list').innerHTML = msg.content;
      scrollToAnchor(msg.anchor);
      break;
    case 'fetching':
      document.getElementById('spinner-older').classList.toggle('hidden', !msg.fetchingOlder);
      document.getElementById('spinner-newer').classList.toggle('hidden', !msg.fetchingNewer);
      break;
    case 'typing':
      document.getElementById('typing').innerHTML = msg.content;
      setTimeout(() => scrollToBottomIfNearEnd());
      break;
    default:
  }
});

window.addEventListener('scroll', () => {
  const startNode = getMessageNode(document.elementFromPoint(200, 20));
  const endNode = getMessageNode(document.elementFromPoint(200, window.innerHeight - 50));
  console.log(startNode, endNode);

  window.postMessage(
    JSON.stringify({
      type: 'scroll',
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      offsetHeight: document.body.offsetHeight,
    }),
    '*',
  );
});

document.body.addEventListener('click', e => {
  sendMessage({
    type: 'click',
    target: e.target,
    targetNodeName: e.target.nodeName,
    targetClassName: e.target.className,
    matches: e.target.matches('a[target="_blank"] > img'),
  });

  if (e.target.matches('.avatar-img')) {
    sendMessage({
      type: 'avatar',
      fromEmail: e.target.getAttribute('data-email'),
    });
  }

  if (e.target.matches('.header')) {
    sendMessage({
      type: 'narrow',
      narrow: e.target.getAttribute('data-narrow'),
      id: e.target.getAttribute('data-id'),
    });
  }

  if (e.target.matches('a[target="_blank"] > img')) {
    sendMessage({
      type: 'image',
      src: e.target.parentNode.getAttribute('href'),
      messageId: +getMessageIdFromNode(e.target),
    });
  } else if (e.target.matches('a')) {
    sendMessage({
      type: 'url',
      href: e.target.getAttribute('href'),
      messageId: +getMessageIdFromNode(e.target),
    });
  }

  if (e.target.matches('.reaction')) {
    sendMessage({
      type: 'reaction',
      name: e.target.getAttribute('data-name'),
      messageId: +getMessageIdFromNode(e.target),
      voted: e.target.classList.contains('self-voted'),
    });
  }

  return false;
});