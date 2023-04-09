const substitutionMap = {
  a: ["@", "4"],
  b: ["8"],
  e: ["3"],
  i: ["1", "!", "|"],
  o: ["0"],
  s: ["$", "5"],
  t: ["7"],
  g: ["9", "6"],
  z: ["2"],
};
type SubstitutionMapKey = keyof typeof substitutionMap;

const fuzzyWordCheck = (text: string, word: string) => {
  const isAlpha = (char: string) => /[a-zA-Z]/.test(char);
  let foundIndex = 0;
  let newText = "";
  let hasMatchedChar = false;
  text.split("").forEach((char, index) => {
    if (index === 0) {
      const nextChar = text[index + 1];

      // if is alpha and char is equal to word at found index
      if (
        isAlpha(nextChar) &&
        char === word[foundIndex] &&
        nextChar === word[foundIndex + 1]
      ) {
        newText += char;
        foundIndex += 1;
        // if is alpha and next char is equal to word at found index + 1 and char is not alpha
      } else if (char === word[foundIndex] && !isAlpha(nextChar)) {
        newText += char;
        foundIndex += 1;
      }

      if (
        isAlpha(nextChar) &&
        nextChar === word[foundIndex + 1] &&
        !isAlpha(char) &&
        !hasMatchedChar
      ) {
        newText += ".";
        hasMatchedChar = true;
        foundIndex += 1;
      }
    }

    if (index > 0 && index < text.length - 1) {
      const nextChar = text[index + 1];
      const prevChar = text[index - 1];

      if (isAlpha(nextChar) && isAlpha(prevChar)) {
        if (char === word[foundIndex]) {
          newText += char;
          foundIndex += 1;
        }
        if (
          (nextChar === word[foundIndex + 1] ||
            prevChar === word[foundIndex - 1]) &&
          !isAlpha(char) &&
          !hasMatchedChar
        ) {
          newText += ".";
          hasMatchedChar = true;
          foundIndex += 1;
        }
      } else {
        if (char === word[foundIndex]) {
          newText += char;
          foundIndex += 1;
        }

        if (
          (nextChar === word[foundIndex + 1] ||
            prevChar === word[foundIndex - 1]) &&
          !isAlpha(char) &&
          !hasMatchedChar
        ) {
          newText += ".";
          hasMatchedChar = true;
          foundIndex += 1;
        }
      }
    }
    if (index === text.length - 1) {
      const prevChar = text[index - 1];
      if (isAlpha(prevChar)) {
        if (char === word[foundIndex]) {
          newText += char;
          foundIndex += 1;
        }
        if (
          prevChar === word[foundIndex - 1] &&
          !isAlpha(char) &&
          !hasMatchedChar
        ) {
          newText += ".";
          hasMatchedChar = true;
          foundIndex += 1;
        }
      } else {
        if (char === word[foundIndex]) {
          newText += char;
          foundIndex += 1;
        }

        if (
          prevChar === word[foundIndex - 1] &&
          !isAlpha(char) &&
          !hasMatchedChar
        ) {
          newText += ".";
          hasMatchedChar = true;
          foundIndex += 1;
        }
      }
    }
  });
  return newText;
};

export const checkStopWords = (
  unformattedText: string,
  UNFILTERED_STOP_WORDS: string[],
  relaxedStopWords: string[]
) => {
  // do some basic checks before proceeding such as length, text only digits or text only symbols
  if (unformattedText.length < 3 || /^\d+$/.test(unformattedText)) {
    return false;
  }
  const STOP_WORDS = UNFILTERED_STOP_WORDS.filter(
    (w) => !relaxedStopWords.includes(w)
  );
  let foundRelaxedStopWord = false;

  const substitutionMapValues = Object.values(substitutionMap);
  const replacedText = unformattedText
    .toLowerCase()
    .split("")
    .map((char) => {
      if (substitutionMapValues.some((subs) => subs.includes(char))) {
        const key = Object.keys(substitutionMap).find(
          (k) => substitutionMap[k as SubstitutionMapKey].indexOf(char) > -1
        );
        return key;
      }
      return char;
    })
    .join("");
  try {
    const noSpaceText = replacedText.replace(/\s/g, "");
    STOP_WORDS.forEach((word) => {
      if (replacedText.includes(word)) {
        throw new Error(`${word} is a stop word`);
      }
      const newText = fuzzyWordCheck(noSpaceText, word);
      if (newText.length === 0 || newText.length < word.length) {
        return false;
      }

      const regex = new RegExp(`\\b${newText.toLowerCase()}`, "i");
      if (regex.test(word)) {
        throw new Error(`${word} ${newText} is a stop word`);
      }
    });

    relaxedStopWords.forEach((word) => {
      // need to verify there is no space between the word and the replaced text
      if (
        replacedText.includes(word) &&
        replacedText.length !== word.length &&
        !replacedText.includes(" ")
      ) {
        foundRelaxedStopWord = true;
      }
      if (foundRelaxedStopWord) {
        return false;
      }
      const newText = fuzzyWordCheck(replacedText, word);
      const regex = new RegExp(`\\b${newText.toLowerCase()}`, "i");

      // check the replacedText length to make sure it is not a substring of the word && to see if it is a stop word
      if (
        regex.test(word) &&
        ((replacedText.length === word.length && !replacedText.includes(" ")) ||
          (replacedText.length !== word.length &&
            replacedText.includes(" "))) &&
        newText.length === word.length
      ) {
        throw new Error(`${word} ${newText} is a stop word from relaxed`);
      }
      if (
        regex.test(word) &&
        replacedText.length > word.length &&
        !replacedText.includes(" ") &&
        newText.length === word.length
      ) {
        foundRelaxedStopWord = true;
      }
    });
    if (foundRelaxedStopWord) {
      return false;
    }
  } catch (e) {
    return true;
  }

  return false;
};
