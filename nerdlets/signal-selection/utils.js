export const entityTypeFilter = (operator, values, conjunction) => {
  if (!operator || !values) return '';
  let clause = '';
  if (Array.isArray(values)) {
    const [domains, types] = values.reduce(
      (acc, { domain, type }) => [
        [...acc[0], `'${domain}'`],
        [...acc[1], `'${type}'`],
      ],
      [[], []]
    );
    if (operator === 'IN') {
      clause = `(domain IN (${domains.join(', ')}) AND type IN (${types.join(
        ', '
      )}))`;
    } else if (operator === 'NOT IN') {
      clause = `(domain NOT IN (${domains.join(
        ', '
      )}) AND type NOT IN (${types.join(', ')}))`;
    }
  } else {
    if (operator === '=') {
      clause = `(domain = '${values.domain}' AND type = '${values.type}')`;
    } else if (operator === '!=') {
      clause = `(domain != '${values.domain}' AND type != '${values.type}')`;
    }
  }
  return clause ? `${clause} ${conjunction}` : '';
};

export const filtersArrayToNrql = (filters = []) =>
  filters
    .map((filter, i) => {
      const lastIndex = filters.length - 1;
      const conjunction =
        i === lastIndex ? '' : filter.conjunction?.value || '';
      if (!conjunction && i < lastIndex) return '';
      const key = filter.key?.value;
      if (!key) return '';
      const {
        value: operator,
        multiValue,
        noValueNeeded,
        partialMatches,
      } = filter.operator || {};
      if (!operator) return '';
      if (key === 'entity type')
        return entityTypeFilter(operator, filter.values, conjunction);
      let valueStr = '';
      if (multiValue && Array.isArray(filter.values)) {
        const valuesArr = filter.values
          ?.map(({ value } = {}) => (value?.trim?.() ? `'${value}'` : ''))
          .filter(Boolean);
        valueStr = valuesArr.length ? `(${valuesArr.join(', ')})` : '';
      } else if (filter?.values?.value?.trim?.()) {
        if (partialMatches) {
          valueStr = `'%${filter.values.value}%'`;
        } else if (operator === 'STARTS WITH') {
          valueStr = `'%${filter.values.value}'`;
        } else if (operator === 'ENDS WITH') {
          valueStr = `'${filter.values.value}%'`;
        } else {
          valueStr = `'${filter.values.value}'`;
        }
      }
      if (!valueStr && !noValueNeeded) return '';
      return `${
        key === 'name' ? key : `\`tags.${key}\``
      } ${operator} ${valueStr} ${conjunction}`;
    })
    .join(' ');
