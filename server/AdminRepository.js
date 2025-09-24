const DatabaseConfig = require('./DatabaseConfig');
const { getDatabase } = DatabaseConfig;

/**
 * Repository para operações administrativas do blog
 * Gerencia temas, configurações e dados administrativos
 */

/**
 * Obtém todos os temas
 */
async function getAllThemes() {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    const { data, error } = await client
      .from('themes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching themes from Supabase:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllThemes:', error);
    throw error;
  }
}

/**
 * Obtém tema por ID
 */
async function getThemeById(id) {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    const { data, error } = await client
      .from('themes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching theme from Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getThemeById:', error);
    throw error;
  }
}

/**
 * Cria um novo tema
 */
async function createTheme(themeData) {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    const { data, error } = await client
      .from('themes')
      .insert({
        name: themeData.name,
        description: themeData.description,
        tags: themeData.tags,
        active: themeData.active || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating theme in Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createTheme:', error);
    throw error;
  }
}

/**
 * Atualiza um tema existente
 */
async function updateTheme(id, themeData) {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    // First get the current theme
    const { data: currentTheme, error: fetchError } = await client
      .from('themes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current theme:', fetchError);
      throw fetchError;
    }
    
    // Merge current data with updates
    const updatedData = {
      ...currentTheme,
      ...themeData,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await client
      .from('themes')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating theme in Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateTheme:', error);
    throw error;
  }
}

/**
 * Remove um tema
 */
async function deleteTheme(id) {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    const { error } = await client
      .from('themes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting theme from Supabase:', error);
      throw error;
    }
    
    return { success: true, message: 'Theme deleted successfully' };
  } catch (error) {
    console.error('Error in deleteTheme:', error);
    throw error;
  }
}

/**
 * Obtém configurações do sistema
 */
async function getSettings() {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    const { data, error } = await client
      .from('system_settings')
      .select('*');
    
    if (error) {
      console.error('Error fetching settings from Supabase:', error);
      throw error;
    }
    
    // Convert array of key-value pairs to object
    const settings = {};
    if (data) {
      data.forEach(item => {
        settings[item.key] = item.value;
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Error in getSettings:', error);
    throw error;
  }
}

/**
 * Cria configurações iniciais
 */
async function createSettings(settingsData) {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    // Convert object to array of key-value pairs for Supabase
    const settingsArray = Object.entries(settingsData).map(([key, value]) => ({
      id: key,
      key,
      value: typeof value === 'boolean' ? value.toString() : value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await client
      .from('system_settings')
      .insert(settingsArray)
      .select();
    
    if (error) {
      console.error('Error creating settings in Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createSettings:', error);
    throw error;
  }
}

/**
 * Atualiza configurações do sistema
 */
async function updateSettings(settingsData) {
  const { client } = DatabaseConfig.getDatabase();
  
  try {
    // For Supabase, we need to upsert each setting
    const results = [];
    
    for (const [key, value] of Object.entries(settingsData)) {
      const { data, error } = await client
        .from('system_settings')
        .upsert({
          id: key,
          key,
          value: typeof value === 'boolean' ? value.toString() : value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })
        .select();
      
      if (error) {
        console.error('Error updating setting in Supabase:', error);
        throw error;
      }
      
      results.push(data);
    }
    
    return results;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    throw error;
  }
}

module.exports = {
  getAllThemes,
  getThemeById,
  createTheme,
  updateTheme,
  deleteTheme,
  getSettings,
  createSettings,
  updateSettings
};