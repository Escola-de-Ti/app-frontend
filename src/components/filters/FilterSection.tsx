// src/components/filters/FilterSection.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FilterButton } from './FilterButton';
import { SelectedFilterTag } from './SelectedFilterTag';

export function FilterSection() {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const handleSelectFilter = (filter: string) => {
    setSelectedFilter((prev) => (prev === filter ? null : filter));
  };

  const handleRemoveFilter = () => {
    setSelectedFilter(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tagsContainer}>
        {selectedFilter && (
          <SelectedFilterTag filter={selectedFilter} onRemove={handleRemoveFilter} />
        )}
      </View>

      <FilterButton onSelectFilter={handleSelectFilter} activeFilter={selectedFilter} />
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
