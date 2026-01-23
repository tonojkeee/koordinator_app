# Common Patterns

## Advanced React Patterns

**ForwardRef with Custom Components**:
```typescript
interface MessageInputHandle {
  handleMention: (username: string) => void;
  openForReaction: (msgId: number) => void;
}

interface MessageInputProps {
  // ... props
}

const MessageInput = React.forwardRef<MessageInputHandle, MessageInputProps>(
  (props, ref) => {
    const [inputValue, setInputValue] = useState('');

    // Expose methods to parent via imperative handle
    React.useImperativeHandle(ref, () => ({
      handleMention: (username: string) => {
        setInputValue(prev => prev + '@' + username + ' ');
      },
      openForReaction: (msgId: number) => {
        // Open emoji picker for this message
      }
    }));

    return <input value={inputValue} onChange={e => setInputValue(e.target.value)} />;
  }
);

// Usage in parent
const ParentComponent = () => {
  const messageInputRef = useRef<MessageInputHandle>(null);

  const handleMentionClick = (username: string) => {
    messageInputRef.current?.handleMention(username);
  };

  return <MessageInput ref={messageInputRef} />;
};
```

## API Calls (Frontend)

**TanStack Query Pattern**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => api.get(`/users/${userId}`)
});

// With mutations
const mutation = useMutation({
  mutationFn: (userData) => api.post('/users', userData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    showToast({ message: "User created", type: "success" });
  },
  onError: (error) => {
    showToast({ message: "Failed to create user", type: "error" });
  }
});

// With optimistic updates
const updateMutation = useMutation({
  mutationFn: async ({ id, content }: { id: number; content: string }) => {
    const res = await api.put(`/messages/${id}`, { content });
    return res.data;
  },
  onMutate: async ({ id, content }) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['messages'] });

    // Snapshot the previous value
    const previousMessages = queryClient.getQueryData(['messages']);

    // Optimistically update to the new value
    queryClient.setQueryData(['messages'], (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: Message[]) =>
          page.map(m =>
            m.id === id ? { ...m, content } : m
          )
        ),
      };
    });

    // Return context with our snapshotted value
    return { previousMessages };
  },
  onError: (err, variables, context) => {
    // If the mutation fails, use the context returned from onMutate
    queryClient.setQueryData(['messages'], context?.previousMessages);
  },
  onSettled: () => {
    // Always refetch after error or success to ensure data is consistent
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  }
});
```

## Service Layer (Backend)

**Service Class Pattern**:
```python
class UserService:
    @staticmethod
    async def get_user(user_id: int, db: AsyncSession) -> UserResponse:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.model_validate(user)
    
    @staticmethod
    async def create_user(user_data: UserCreate, db: AsyncSession) -> UserResponse:
        # Validate unique email
        existing = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")
        
        user = User(**user_data.model_dump())
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return UserResponse.model_validate(user)
```

## Error Handling

**Frontend Error Boundary**:
```typescript
try {
  await fetchData();
} catch (error) {
  console.error('API Error:', error);
  showToast({ 
    message: error.response?.data?.detail || "Something went wrong", 
    type: "error" 
  });
}
```

**Backend Error Response**:
```python
try:
    result = await some_operation()
    return result
except ValueError as e:
    logger.error(f"Validation error: {e}", exc_info=True)
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal server error")
```

## WebSocket Patterns

**Frontend WebSocket Hook**:
```typescript
const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle message
    };

    setSocket(ws);
    return () => ws.close();
  }, [url]);

  return { socket, isConnected };
};
```

**Message Type Discriminator**:
```typescript
type WebSocketMessage =
  | { type: 'new_message' } & Message
  | { type: 'reaction_added'; message_id: number; reaction: Reaction }
  | { type: 'user_presence'; user_id: number; status: 'online' | 'offline' };

const handleMessage = (data: WebSocketMessage) => {
  if (data.type === 'new_message') {
    // Handle message
  } else if (data.type === 'reaction_added') {
    // Handle reaction
  }
  // TypeScript will infer proper types for each branch
};
```

**Infinite Query (Pagination)**:
```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['messages', channelId],
  queryFn: async ({ pageParam = 0 }) => {
    const offset = pageParam * 50;
    const res = await api.get(`/chat/channels/${channelId}/messages?limit=50&offset=${offset}`);
    return res.data;
  },
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.length === 50 ? allPages.length : undefined;
  },
  initialPageParam: 0,
});

const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const container = e.currentTarget;
  if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
};
```