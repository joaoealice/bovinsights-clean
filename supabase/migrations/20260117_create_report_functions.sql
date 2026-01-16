-- 1. RELATÓRIO DE REBANHO ATUAL
-- Esta função retorna um resumo do rebanho ativo de um usuário,
-- buscando a última pesagem de cada animal.
create or replace function get_relatorio_rebanho_atual(user_id_param uuid)
returns table (
    fazenda_nome varchar(200),
    quantidade_total_animais bigint,
    peso_medio_atual numeric,
    peso_total_rebanho numeric,
    data_ultima_pesagem timestamp with time zone
)
language plpgsql
as $$
begin
    return query
    with ultima_pesagem_por_animal as (
        select
            p.animal_id,
            p.peso,
            p.data_pesagem,
            row_number() over(partition by p.animal_id order by p.data_pesagem desc) as rn
        from pesagens p
        join animais a on p.animal_id = a.id
        where a.usuario_id = user_id_param and a.status = 'Ativo'
    ),
    rebanho_ativo as (
        select
            a.id as animal_id,
            up.peso as peso_atual,
            up.data_pesagem
        from animais a
        join ultima_pesagem_por_animal up on a.id = up.animal_id
        where a.usuario_id = user_id_param
          and a.status = 'Ativo'
          and up.rn = 1
    )
    select
        pu.nome_fazenda,
        count(ra.animal_id) as quantidade_total_animais,
        round(avg(ra.peso_atual), 2) as peso_medio_atual,
        sum(ra.peso_atual) as peso_total_rebanho,
        max(ra.data_pesagem) as data_ultima_pesagem
    from rebanho_ativo ra
    cross join perfil_usuario pu
    where pu.usuario_id = user_id_param
    group by pu.nome_fazenda;
end;
$$;

-- 2. RELATÓRIO DE PESAGENS E DESEMPENHO
-- Retorna o histórico de pesagens, calculando o ganho de peso e GMD entre cada pesagem.
create or replace function get_relatorio_pesagens_desempenho(
    user_id_param uuid,
    data_inicio_param date,
    data_fim_param date
)
returns table (
    animal_id uuid,
    brinco text,
    lote_nome text,
    data_pesagem timestamp with time zone,
    peso_atual numeric,
    peso_anterior numeric,
    ganho_no_periodo numeric,
    dias_entre_pesagens integer,
    gmd numeric
)
language plpgsql
as $$
begin
    return query
    with pesagens_com_lag as (
        select
            p.animal_id,
            a.brinco,
            l.nome as lote_nome,
            p.data_pesagem,
            p.peso,
            lag(p.peso, 1, 0) over(partition by p.animal_id order by p.data_pesagem) as peso_anterior,
            lag(p.data_pesagem, 1) over(partition by p.animal_id order by p.data_pesagem) as data_anterior
        from pesagens p
        join animais a on p.animal_id = a.id
        left join lotes l on a.lote_id = l.id
        where p.usuario_id = user_id_param
          and p.data_pesagem between data_inicio_param and data_fim_param
    )
    select
        pcl.animal_id,
        pcl.brinco,
        pcl.lote_nome,
        pcl.data_pesagem,
        pcl.peso as peso_atual,
        pcl.peso_anterior,
        (pcl.peso - pcl.peso_anterior) as ganho_no_periodo,
        case
            when pcl.data_anterior is not null then (pcl.data_pesagem::date - pcl.data_anterior::date)
            else 0
        end as dias_entre_pesagens,
        case
            when pcl.data_anterior is not null and (pcl.data_pesagem::date - pcl.data_anterior::date) > 0
            then round((pcl.peso - pcl.peso_anterior) / (pcl.data_pesagem::date - pcl.data_anterior::date), 3)
            else 0
        end as gmd
    from pesagens_com_lag pcl
    order by pcl.brinco, pcl.data_pesagem;
end;
$$;


-- 3. RELATÓRIO DE DESEMPENHO POR LOTE
-- Analisa o desempenho consolidado de cada lote.
create or replace function get_relatorio_desempenho_lote(user_id_param uuid)
returns table (
    lote_id uuid,
    lote_nome text,
    quantidade_animais bigint,
    peso_medio_inicial numeric,
    peso_medio_atual numeric,
    ganho_medio_total numeric,
    gmd_medio numeric,
    dias_no_sistema numeric
)
language plpgsql
as $$
begin
    return query
    with pesagens_ordenadas as (
      select
        a.lote_id,
        p.animal_id,
        p.peso,
        p.data_pesagem,
        row_number() over(partition by p.animal_id order by p.data_pesagem asc) as rn_asc,
        row_number() over(partition by p.animal_id order by p.data_pesagem desc) as rn_desc
      from pesagens p
      join animais a on p.animal_id = a.id
      where a.usuario_id = user_id_param and a.lote_id is not null and a.status = 'Ativo'
    ),
    pesos_extremos as (
      select
        po.lote_id,
        po.animal_id,
        max(case when po.rn_asc = 1 then po.peso else null end) as peso_inicial,
        max(case when po.rn_asc = 1 then po.data_pesagem else null end) as data_inicial,
        max(case when po.rn_desc = 1 then po.peso else null end) as peso_atual,
        max(case when po.rn_desc = 1 then po.data_pesagem else null end) as data_atual
      from pesagens_ordenadas po
      group by po.lote_id, po.animal_id
    ),
    desempenho_animal as (
      select
        pe.lote_id,
        pe.animal_id,
        pe.peso_inicial,
        pe.peso_atual,
        (pe.peso_atual - pe.peso_inicial) as ganho_total,
        (pe.data_atual::date - pe.data_inicial::date) as dias_no_sistema,
        case
            when (pe.data_atual::date - pe.data_inicial::date) > 0
            then (pe.peso_atual - pe.peso_inicial) / (pe.data_atual::date - pe.data_inicial::date)
            else 0
        end as gmd_animal
      from pesos_extremos pe
      where pe.peso_inicial is not null and pe.peso_atual is not null
    )
    select
      l.id as lote_id,
      l.nome as lote_nome,
      count(da.animal_id) as quantidade_animais,
      round(avg(da.peso_inicial), 2) as peso_medio_inicial,
      round(avg(da.peso_atual), 2) as peso_medio_atual,
      round(avg(da.ganho_total), 2) as ganho_medio_total,
      round(avg(da.gmd_animal), 3) as gmd_medio,
      round(avg(da.dias_no_sistema)) as dias_no_sistema
    from desempenho_animal da
    join lotes l on da.lote_id = l.id
    where l.usuario_id = user_id_param
    group by l.id, l.nome
    order by l.nome;
end;
$$;
