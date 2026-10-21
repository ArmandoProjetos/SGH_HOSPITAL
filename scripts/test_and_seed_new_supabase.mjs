import { createClient } from '@supabase/supabase-js';

const url = 'https://irodldmlnredghdcsbcg.supabase.co';
const serviceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlyb2RsZG1sbnJlZGdoZGNzYmNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjU4MzY5MywiZXhwIjoyMTA4MTU5NjkzfQ.2iqfhEAKAbg4MmvS_74Me6pNIY2LjtWJtGSP9WHoTfc';

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('--- TESTANDO LIGAÇÃO À NOVA BASE DE DADOS SUPABASE ---');
  
  // 1. Testar se a tabela hospitais existe
  const { data: hospitais, error: errHosp } = await supabase.from('hospitais').select('*').limit(5);
  if (errHosp) {
    console.error('Aviso ao consultar tabela hospitais:', errHosp.message);
    if (errHosp.code === '42P01') {
      console.log('ATENÇÃO: As tabelas ainda não foram criadas no SQL Editor do Supabase.');
      console.log('Execute o script supabase/schema.sql no SQL Editor para criar as tabelas.');
      process.exit(0);
    }
  } else {
    console.log(`Tabela hospitais OK! Encontrados ${hospitais.length} hospitais.`);
  }

  // 2. Criar ou obter hospital de demonstração padrão
  let hospitalId = 'a0000000-0000-0000-0000-000000000001';
  const { data: hospExistente } = await supabase.from('hospitais').select('id').eq('id', hospitalId).maybeSingle();
  if (!hospExistente) {
    const { error: insErr } = await supabase.from('hospitais').insert({
      id: hospitalId,
      nome: 'Hospital Geral & Centro Clínico',
      nuit: '400928172',
      endereco: 'Av. Eduardo Mondlane, Nº 1420, Maputo, Moçambique',
      telefone: '+258 21 490 800',
      email: 'contacto@hospitalgeral.co.mz',
    });
    if (insErr) {
      console.log('Erro ao inserir hospital seed:', insErr.message);
    } else {
      console.log('Hospital padrão criado com sucesso!');
    }
  }

  // 3. Provisionar os 4 Utilizadores RBAC no Supabase Auth
  const usuarios = [
    { email: 'admin@hospital.com', pass: 'admin123', nome: 'Dr. Marcelo Mondlane (Diretor Geral)', papel: 'ADMINISTRADOR' },
    { email: 'medico@hospital.com', pass: 'medico123', nome: 'Dr. Lucas Silveira (Médico Clínico)', papel: 'MEDICO' },
    { email: 'farmacia@hospital.com', pass: 'farmacia123', nome: 'Dr. Tomás Sitoe (Farmacêutico Chefe)', papel: 'FARMACEUTICO' },
    { email: 'recepcao@hospital.com', pass: 'recepcao123', nome: 'Helena Macamo (Recepção & Triagem)', papel: 'RECEPCIONISTA' },
  ];

  for (const u of usuarios) {
    // Listar utilizadores para ver se já existe
    const { data: listData } = await supabase.auth.admin.listUsers();
    const jaExiste = listData?.users?.find((x) => x.email === u.email);

    let userId = jaExiste?.id;

    if (!userId) {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.pass,
        email_confirm: true,
        user_metadata: {
          nome: u.nome,
          hospital_nome: 'Hospital Geral & Centro Clínico',
        },
      });

      if (createErr) {
        console.error(`Erro ao criar utilizador ${u.email}:`, createErr.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`Utilizador ${u.email} criado no Supabase Auth (ID: ${userId})`);
    } else {
      console.log(`Utilizador ${u.email} já existe no Supabase Auth.`);
      // Atualizar password para garantir que está sincronizada
      await supabase.auth.admin.updateUserById(userId, { password: u.pass });
    }

    // Garantir perfil na tabela perfis
    const { error: perfErr } = await supabase.from('perfis').upsert({
      id: userId,
      hospital_id: hospitalId,
      nome: u.nome,
      email: u.email,
      papel: u.papel,
      activo: true,
    });

    if (perfErr) {
      console.error(`Erro ao sincronizar perfil de ${u.email}:`, perfErr.message);
    } else {
      console.log(`Perfil ${u.papel} associado a ${u.email}.`);
    }
  }

  console.log('--- SINCRONIZAÇÃO DA NOVA BASE DE DADOS CONCLUÍDA COM SUCESSO ---');
}

main().catch(console.error);
