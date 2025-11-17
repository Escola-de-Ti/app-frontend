import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInputProps,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { buscarUsuariosPorNome, type RankingUsuarioDTO } from '../../services/user';

export type InputFilterFeedProps = {
  value: string;
  onChangeText: (t: string) => void;
  onSearch?: (t: string) => void;
  /** callback disparado com debounce enquanto digita (opcional) – ainda disponível pro pai */
  onDebouncedChange?: (t: string) => void;
  loading?: boolean;
  placeholder?: string;
  /** tempo do debounce em ms (padrão 280) */
  debounceMs?: number;
  /** props adicionais pro TextInput */
  inputProps?: TextInputProps;
};

export default function InputFilterFeed({
  value,
  onChangeText,
  onSearch,
  onDebouncedChange,
  loading = false,
  placeholder = 'Buscar usuários…',
  debounceMs = 280,
  inputProps,
}: InputFilterFeedProps) {
  const navigation = useNavigation<any>();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>('');

  const [userResults, setUserResults] = useState<RankingUsuarioDTO[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const isLoading = loading || userLoading;

  const performUserSearch = useCallback(async (text: string) => {
    const query = (text || '').trim();
    lastQueryRef.current = text;
    setUserError(null);

    if (!query) {
      setUserResults([]);
      setUserLoading(false);
      return;
    }

    try {
      setUserLoading(true);
      const data = await buscarUsuariosPorNome(query);

      // evita aplicar resultado atrasado se o usuário já digitou outra coisa
      if (lastQueryRef.current === text) {
        setUserResults(data);
      }
    } catch (e: any) {
      console.log('[InputFilterFeed][buscarUsuariosPorNome][ERR]', e?.message);
      if (lastQueryRef.current === text) {
        setUserError('Erro ao buscar usuários.');
        setUserResults([]);
      }
    } finally {
      if (lastQueryRef.current === text) {
        setUserLoading(false);
      }
    }
  }, []);

  // debounce: dispara busca de usuários + callback opcional do pai
  useEffect(() => {
    if (!onDebouncedChange && !buscarUsuariosPorNome) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (onDebouncedChange) {
        onDebouncedChange(value);
      }
      // componente inteligente: faz a busca de usuários por conta própria
      performUserSearch(value);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, onDebouncedChange, debounceMs, performUserSearch]);

  const showClear = useMemo(() => !!value?.length && !isLoading, [value, isLoading]);

  const handleSubmitSearch = () => {
    onSearch?.(value);
    // também força uma busca imediata se o usuário apertar enter
    performUserSearch(value);
  };

  const handleSelectUser = (user: RankingUsuarioDTO) => {
    // se quiser limpar resultados ao clicar:
    setUserResults([]);
    // opcional: manter o texto ou trocar pelo nome do usuário
    // onChangeText(user.nome);
    navigation.navigate('ProfileScreen', { userId: user.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        <Feather name="search" size={16} color="#9AA0A6" style={styles.leftIcon} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#777"
          returnKeyType="search"
          onSubmitEditing={handleSubmitSearch}
          style={styles.input}
          autoCapitalize="none"
          {...inputProps}
        />

        {isLoading ? (
          <ActivityIndicator style={styles.rightIcon} />
        ) : showClear ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => {
              onChangeText('');
              setUserResults([]);
              setUserError(null);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={16} color="#9AA0A6" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Lista de usuários encontrados */}
      {userError && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{userError}</Text>
        </View>
      )}

      {!userError && !isLoading && value.trim().length > 0 && userResults.length === 0 && (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>Nenhum usuário encontrado.</Text>
        </View>
      )}

      {userResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {userResults.map((user) => (
            <TouchableOpacity
              key={String(user.id)}
              style={styles.resultRow}
              activeOpacity={0.8}
              onPress={() => handleSelectUser(user)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.nome?.charAt(0).toUpperCase() || '?'}</Text>
              </View>

              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{user.nome}</Text>
                <Text style={styles.resultSub}>
                  Nível {user.nivel} · {user.qntdXp} XP · #{user.posicao}
                </Text>
              </View>

              <Feather name="chevron-right" size={18} color="#777" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // envolve input + resultados
    width: '100%',
  },
  wrap: {
    position: 'relative',
    backgroundColor: '#1A1A1F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A33',
  },
  input: {
    color: '#EDEDF5',
    paddingVertical: 10,
    paddingLeft: 36, // espaço pro ícone
    paddingRight: 32, // espaço pro clear/loader
    fontSize: 14,
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
    top: 11,
  },
  rightIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  resultsContainer: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#2A2A33',
    maxHeight: 260,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262630',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2A2A33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#F5F5FF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultSub: {
    color: '#A0A0B5',
    fontSize: 12,
    marginTop: 2,
  },
  feedbackBox: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  feedbackText: {
    color: '#A0A0B5',
    fontSize: 12,
  },
});
