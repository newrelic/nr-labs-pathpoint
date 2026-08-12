import React, { useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'nr1';

const LANGUAGE = {
  GRAPHQL: 'graphql',
  HCL: 'hcl',
};

// each regex has one named group per token type; only one group matches per
// pass, so whichever group comes back non-undefined tells us the token type
const TOKEN_REGEX = {
  [LANGUAGE.GRAPHQL]:
    /(?<comment>#.*)|(?<string>"(?:\\.|[^"\\])*")|(?<keyword>\b(?:mutation|query|subscription|fragment|on|true|false|null)\b)|(?<enumValue>\b[A-Z][A-Z0-9_]*\b)|(?<number>-?\b\d+(?:\.\d+)?\b)|(?<punct>[{}()[\]:,!])|(?<identifier>[A-Za-z_][A-Za-z0-9_]*)/g,
  [LANGUAGE.HCL]:
    /(?<comment>\/\/.*|#.*|\/\*[\s\S]*?\*\/)|(?<string>"(?:\\.|[^"\\])*")|(?<keyword>\b(?:resource|data|variable|output|module|provider|locals|terraform|for_each|count|true|false|null)\b)|(?<number>-?\b\d+(?:\.\d+)?\b)|(?<punct>[{}()[\]=,.])|(?<identifier>[A-Za-z_][A-Za-z0-9_-]*)/g,
};

const tokenize = (code, language) => {
  const regex = TOKEN_REGEX[language];
  if (!regex || !code) return [{ text: code || '', type: 'plain' }];

  const tokens = [];
  let lastIndex = 0;
  for (const match of code.matchAll(regex)) {
    if (match.index > lastIndex)
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'plain' });
    const [type] =
      Object.entries(match.groups || {}).find(
        ([, value]) => value !== undefined
      ) || [];
    tokens.push({ text: match[0], type: type || 'plain' });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length)
    tokens.push({ text: code.slice(lastIndex), type: 'plain' });

  return tokens;
};

const CodeViewer = ({
  code = '',
  language = LANGUAGE.GRAPHQL,
  fileName,
  width,
  height,
}) => {
  const linkRef = useRef(null);
  const tokens = useMemo(() => tokenize(code, language), [code, language]);

  const downloadClickHandler = useCallback(() => {
    const anchor = linkRef.current;
    if (!anchor) return;
    anchor.href = `data:text/plain;charset=utf-8,${encodeURIComponent(code)}`;
    anchor.download = fileName || 'code.txt';
    anchor.click();
  }, [code, fileName]);

  // the 1px border on each side isn't included in the width/height AutoSizer
  // measures for us, so shrink by that much to avoid overflowing the wrapper
  const borderAdjustedWidth = typeof width === 'number' ? width - 2 : width;
  const borderAdjustedHeight = typeof height === 'number' ? height - 2 : height;

  return (
    <div
      className="code-viewer"
      style={{ width: borderAdjustedWidth, height: borderAdjustedHeight }}
    >
      <div className="code-viewer-header">
        <span className="file-name">{fileName}</span>
        <div className="code-viewer-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Download"
            title="Download"
            onClick={downloadClickHandler}
          >
            <Icon type={Icon.TYPE.INTERFACE__OPERATIONS__DOWNLOAD} />
          </button>
        </div>
      </div>
      <a ref={linkRef} className="hidden-download-link" />
      <pre className="code-viewer-body">
        <code>
          {tokens.map(({ text, type }, i) => (
            <span key={i} className={`tok-${type}`}>
              {text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};

CodeViewer.LANGUAGE = LANGUAGE;

CodeViewer.propTypes = {
  code: PropTypes.string,
  language: PropTypes.oneOf(Object.values(LANGUAGE)),
  fileName: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default CodeViewer;
