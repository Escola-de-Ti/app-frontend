import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FilterButton } from './FilterButton';
import { SelectedFilterTag } from './SelectedFilterTag';

export function FilterSection() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSelectFilter = (filter: string) => {
    if (!selectedFilters.includes(filter)) {
      setSelectedFilters((prev) => [...prev, filter]);
    }
  };

  const handleRemoveFilter = (filter: string) => {
    setSelectedFilters((prev) => prev.filter((f) => f !== filter));
  };

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {selectedFilters.map((filter) => (
          <SelectedFilterTag
            key={filter}
            filter={filter}
            onRemove={() => handleRemoveFilter(filter)}
          />
        ))}
      </View>

      <FilterButton onSelectFilter={handleSelectFilter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    justifyContent: 'flex-start',
  },
});
