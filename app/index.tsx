// App.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    View,
    TextInput,
    Button,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Modal,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';

// Определение типов данных для медиа-постов
interface MediaPost {
    id: number;
    tags: string;
    file_url: string;
    owner?: string;
}

const App: React.FC = () => {
    const baseUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=anime&limit=200&json=1`;

    const [media, setMedia] = useState<MediaPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<MediaPost | null>(null);
    const search = useRef<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [savedTags, setSavedTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        loadSavedTags();
    }, []);

    useEffect(() => {
        fetchMedia();
    }, [page, selectedTags]);

    useEffect(() => {
        saveTags();
    }, [savedTags]);

    // Загрузка сохранённых тегов из AsyncStorage
    const loadSavedTags = async () => {
        try {
            const tags = await AsyncStorage.getItem('savedTags');
            if (tags !== null) {
                setSavedTags(JSON.parse(tags));
            }
        } catch (error) {
            console.error('Ошибка при загрузке сохранённых тегов:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить сохранённые теги.');
        }
    };

    // Сохранение тегов в AsyncStorage
    const saveTags = async () => {
        try {
            await AsyncStorage.setItem('savedTags', JSON.stringify(savedTags));
        } catch (error) {
            console.error('Ошибка при сохранении тегов:', error);
            Alert.alert('Ошибка', 'Не удалось сохранить теги.');
        }
    };

    // Функция для получения медиа
    const fetchMedia = async () => {
        setLoading(true);
        const tags = selectedTags.length > 0 ? selectedTags.join('+') : search.current;
        try {
            const response = await axios.get<MediaPost[]>(`${baseUrl}&tags=${tags}&pid=${page - 1}`, {
                headers: {
                    accept: 'application/json',
                },
            });
            setMedia(response.data);
        } catch (error) {
            console.error('Ошибка при получении медиа:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить медиа.');
        } finally {
            setLoading(false);
        }
    };

    // Функция поиска медиа по введённому запросу
    const searchMedia = () => {
        setPage(1);
        fetchMedia();
    };

    // Добавление тега в список выбранных
    const searchByTag = (tag: string) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // Сохранение тега в список сохранённых
    const saveTag = (tag: string) => {
        if (!savedTags.includes(tag)) {
            setSavedTags([...savedTags, tag]);
        }
    };

    // Открытие модального окна с подробностями поста
    const openModal = (post: MediaPost) => {
        setSelectedPost(post);
    };

    // Закрытие модального окна
    const closeModal = () => {
        setSelectedPost(null);
    };

    // Удаление тега из списка выбранных
    const removeTag = (tag: string) => {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
    };

    // Рендер элемента медиа-списка
    const renderMediaItem = ({ item }: { item: MediaPost }) => (
        <TouchableOpacity onPress={() => openModal(item)} style={styles.mediaItem}>
            {item.file_url.endsWith('.mp4') ? (
                <Video
                    source={{ uri: item.file_url }}
                    style={styles.video}
                    controls
                    resizeMode="cover"
                />
            ) : (
                <Image source={{ uri: item.file_url }} style={styles.image} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Заголовок с поиском */}
            <View style={styles.header}>
                <TextInput
                    style={styles.inputText}
                    placeholder="Search..."
                    onChangeText={(text) => (search.current = text)}
                    onSubmitEditing={searchMedia}
                    returnKeyType="search"
                />
                <Button title="Search" onPress={searchMedia} />
            </View>

            {/* Сохранённые теги */}
            <ScrollView horizontal style={styles.savedTagsContainer}>
                {savedTags.map((tag, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => searchByTag(tag)}
                        style={styles.tagButton}
                    >
                        <Text style={styles.tagButtonText}>{tag}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Выбранные теги */}
            <View style={styles.selectedTagsContainer}>
                {selectedTags.map((tag, index) => (
                    <View key={index} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag)}>
                            <Text style={styles.removeTag}>×</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Контейнер медиа */}
            <View style={styles.mediaContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <FlatList
                        data={media}
                        renderItem={renderMediaItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={styles.mediaList}
                    />
                )}
            </View>

            {/* Пагинация */}
            <View style={styles.pagination}>
                <Button
                    title="Previous"
                    onPress={() => setPage(page > 1 ? page - 1 : 1)}
                    disabled={page === 1}
                />
                <Text style={styles.pageNumber}>Page {page}</Text>
                <Button title="Next" onPress={() => setPage(page + 1)} />
            </View>

            {/* Модальное окно */}
            <Modal
                visible={selectedPost !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={closeModal}
            >
                {selectedPost && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {selectedPost.file_url.endsWith('.mp4') ? (
                                <Video
                                    source={{ uri: selectedPost.file_url }}
                                    style={styles.modalVideo}
                                    controls
                                    resizeMode="contain"
                                />
                            ) : (
                                <Image
                                    source={{ uri: selectedPost.file_url }}
                                    style={styles.modalImage}
                                />
                            )}
                            <Text style={styles.ownerText}>Owner: {selectedPost.owner || 'Unknown'}</Text>
                            <View style={styles.modalTags}>
                                {selectedPost.tags.split(' ').map((tag, index) => (
                                    <View key={index} style={styles.modalTag}>
                                        <TouchableOpacity onPress={() => searchByTag(tag)}>
                                            <Text style={styles.modalTagText}>{tag}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => saveTag(tag)}>
                                            <Text style={styles.saveTagButton}>💾</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            <Button title="Close" onPress={closeModal} />
                        </View>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
};

export default App;

// Стилизация компонентов
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    header: {
        flexDirection: 'row',
        paddingVertical: 10,
        alignItems: 'center',
    },
    inputText: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
        height: 40,
    },
    savedTagsContainer: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    tagButton: {
        backgroundColor: '#007bff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 5,
    },
    tagButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    selectedTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 5,
    },
    selectedTag: {
        flexDirection: 'row',
        backgroundColor: '#28a745',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        alignItems: 'center',
        marginRight: 5,
        marginBottom: 5,
    },
    selectedTagText: {
        color: '#fff',
        fontSize: 14,
    },
    removeTag: {
        color: '#fff',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    mediaContainer: {
        flex: 1,
        marginTop: 10,
    },
    mediaList: {
        justifyContent: 'space-between',
    },
    mediaItem: {
        flex: 1,
        margin: 5,
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
    },
    pageNumber: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalImage: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    modalVideo: {
        width: '100%',
        height: 300,
        marginBottom: 10,
    },
    ownerText: {
        fontSize: 16,
        marginBottom: 10,
    },
    modalTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    modalTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6c757d',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        margin: 5,
    },
    modalTagText: {
        color: '#fff',
        marginRight: 5,
    },
    saveTagButton: {
        color: '#fff',
        fontSize: 16,
    },
});
