import { ngql } from 'nr1';

const queryFromGuidsArray = (arrayOfGuids = []) => ngql`{
  actor {
    ${arrayOfGuids.map(
      (arr, idx) =>
        `e${idx}: entities(guids: ["${arr.join('", "')}"]) { guid name }`
    )}
  }
}`;

export { queryFromGuidsArray };
