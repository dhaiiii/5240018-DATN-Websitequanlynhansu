export const getAvatarUrl = (avatar: string | null | undefined) => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('data:')) return avatar;
    return `http://localhost:3001/uploads/${avatar}`;
};
