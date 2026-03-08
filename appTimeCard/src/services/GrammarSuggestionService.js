const LANGUAGE_TOOL_ENDPOINT = 'https://api.languagetool.org/v2/check';

const mapMatchesToSuggestions = (matches = [], sourceText = '') => {
  return matches.slice(0, 3).map((match) => {
    const offset = Number(match?.offset || 0);
    const length = Number(match?.length || 0);
    const original = sourceText.slice(offset, offset + length);
    const topReplacement = Array.isArray(match?.replacements) && match.replacements.length > 0
      ? match.replacements[0].value
      : '';

    return {
      offset,
      length,
      original,
      replacement: topReplacement,
      message: match?.message || 'Posible mejora de redaccion.',
    };
  });
};

const checkText = async (text, language = 'es') => {
  const normalizedText = (text || '').trim();
  if (normalizedText.length < 8) {
    return [];
  }

  try {
    const body = new URLSearchParams();
    body.append('language', language);
    body.append('text', normalizedText);

    const response = await fetch(LANGUAGE_TOOL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return mapMatchesToSuggestions(data?.matches, normalizedText);
  } catch {
    // La revision es opcional: no interrumpe al usuario si falla el servicio externo.
    return [];
  }
};

const applySuggestion = (text, suggestion) => {
  if (!suggestion || !suggestion.replacement) {
    return text;
  }

  const sourceText = String(text || '');
  const offset = Number(suggestion.offset || 0);
  const length = Number(suggestion.length || 0);

  if (offset < 0 || length < 0 || offset > sourceText.length) {
    return sourceText;
  }

  return `${sourceText.slice(0, offset)}${suggestion.replacement}${sourceText.slice(offset + length)}`;
};

const GrammarSuggestionService = {
  checkText,
  applySuggestion,
};

export default GrammarSuggestionService;
