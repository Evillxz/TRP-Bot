const { 
    ContainerBuilder, 
    SectionBuilder, 
    TextDisplayBuilder, 
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder, // <--- Importante
    ThumbnailBuilder,        // <--- Importante
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    MessageFlags 
} = require('discord.js');

module.exports = async (client, data) => {
    try {
        const { channelId, components, editLastMessage } = data;

        const channel = await client.channels.fetch(channelId);
        if (!channel) return { success: false, message: 'Canal não encontrado.' };

        // --- FACTORY: Cria a instância do Builder baseada no tipo ---
        const createBuilder = (compData) => {
            if (!compData) return null;

            switch (compData.type) {
                // 1. TEXT DISPLAY
                case 'text_display':
                    return new TextDisplayBuilder().setContent(compData.content);

                // 2. SEPARATOR
                case 'separator':
                    const sep = new SeparatorBuilder();
                    if (compData.spacing === 'large') sep.setSpacing(SeparatorSpacingSize.Large);
                    else sep.setSpacing(SeparatorSpacingSize.Small);
                    sep.setDivider(!!compData.has_divider);
                    return sep;

                // 3. MEDIA GALLERY
                case 'media_gallery':
                    const gallery = new MediaGalleryBuilder();
                    if (compData.images && Array.isArray(compData.images)) {
                        // Cria os itens da galeria individualmente
                        const items = compData.images.map(img => 
                            new MediaGalleryItemBuilder().setURL(img.url)
                        );
                        // Adiciona usando addItems
                        if (items.length > 0) gallery.addItems(...items);
                    }
                    return gallery;

                // 4. SECTION
                case 'section':
                    const section = new SectionBuilder();
                    
                    // Thumbnail usa setThumbnailAccessory com ThumbnailBuilder
                    if (compData.thumbnail?.url) {
                        section.setThumbnailAccessory(
                            new ThumbnailBuilder().setURL(compData.thumbnail.url)
                        );
                    }

                    // Adiciona textos internos usando addTextDisplayComponents
                    if (compData.content && Array.isArray(compData.content)) {
                        compData.content.forEach(textItem => {
                            // O textItem vem como { type: 'text_display', content: '...' }
                            const textBuilder = new TextDisplayBuilder().setContent(textItem.content);
                            section.addTextDisplayComponents(textBuilder);
                        });
                    }
                    return section;

                // 5. CONTAINER
                case 'container':
                    const container = new ContainerBuilder();
                    if (compData.accent_color) container.setAccentColor(compData.accent_color);

                    // Aqui está o pulo do gato: Temos que usar o método certo para cada tipo de filho
                    if (compData.components && Array.isArray(compData.components)) {
                        compData.components.forEach(childData => {
                            const childBuilder = createBuilder(childData);
                            
                            if (childBuilder) {
                                switch (childData.type) {
                                    case 'text_display':
                                        container.addTextDisplayComponents(childBuilder);
                                        break;
                                    case 'separator':
                                        container.addSeparatorComponents(childBuilder);
                                        break;
                                    case 'section':
                                        container.addSectionComponents(childBuilder);
                                        break;
                                    case 'media_gallery':
                                        container.addMediaGalleryComponents(childBuilder);
                                        break;
                                    // Containers aninhados (dentro de outro container) geralmente não são comuns 
                                    // na estrutura visual atual, mas se houver suporte, seria addContainerComponents
                                }
                            }
                        });
                    }
                    return container;

                default:
                    return null;
            }
        };

        // --- MONTAGEM DA MENSAGEM ---
        
        // Mapeia os componentes da raiz
        const finalComponents = components.map(createBuilder).filter(c => c !== null);

        const messagePayload = {
            flags: [MessageFlags.IsComponentsV2],
            components: finalComponents
        };

        // Envio / Edição
        if (editLastMessage) {
            const messages = await channel.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();
            if (lastMessage && lastMessage.author.id === client.user.id) {
                await lastMessage.edit(messagePayload);
                return { success: true, message: 'Editado (V2).' };
            }
        }

        await channel.send(messagePayload);
        return { success: true, message: 'Enviado (V2).' };

    } catch (error) {
        console.error('Erro V2:', error);
        return { success: false, message: error.message };
    }
};