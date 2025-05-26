-- Insertar tipos de máquinas de prueba
INSERT INTO tipos_maquinas (id, nombre, descripcion) VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Carretilla Elevadora', 'Carretillas elevadoras de diferentes capacidades'),
    ('b5f8c3e1-2d8a-4c1f-9d6b-a7e4b8c9d123', 'Manipulador Telescópico', 'Manipuladores telescópicos de altura variable'),
    ('d2e5a8b4-6c3f-4e2d-9a1b-c8d7e6f5a432', 'Plataforma Elevadora', 'Plataformas elevadoras de tijera y articuladas');

-- Insertar máquinas de prueba
INSERT INTO maquinas (
    tipo_maquina_id,
    cliente,
    numero_bastidor,
    numero_flota,
    numero_horas,
    numero_matricula,
    numero_kilometros,
    zona,
    capacidad,
    numero_fabricacion
) VALUES
    (
        '25ddb3a1-15d1-4a42-a5de-b9513ec1c95f',
        'Construcciones ABC',
        'CE-2023-001',
        'FL001',
        1250.5,
        'M-1234-BC',
        0,
        'Madrid Centro',
        '3000 kg',
        'FAB2023001'
    ),
    (
        '5e12981c-b860-485d-8076-464cd6545c8a',
        'Logística XYZ',
        'MT-2023-002',
        'FL002',
        850.75,
        'M-5678-CD',
        1200.5,
        'Barcelona Sur',
        '4000 kg',
        'FAB2023002'
    ),
    (
        '5f126e0d-7d03-46c5-9ffa-674afe93badf',
        'Industrias 123',
        'PE-2023-003',
        'FL003',
        2100.25,
        'M-9012-EF',
        0,
        'Valencia Norte',
        '500 kg',
        'FAB2023003'
    ),
    (
        '6de04874-ed5e-4a47-815c-788c34027031',
        'Transportes Fast',
        'CE-2023-004',
        'FL004',
        3300.0,
        'M-3456-GH',
        0,
        'Sevilla Este',
        '2500 kg',
        'FAB2023004'
    ),
    (
        '72a714e8-3d6c-488a-8024-2364dd9e663f',
        'Almacenes Store',
        'MT-2023-005',
        'FL005',
        1575.5,
        'M-7890-IJ',
        800.25,
        'Bilbao Centro',
        '3500 kg',
        'FAB2023005'
    ),
    (
        'f4a24b8c-8ffc-4f68-b6f3-95ee13c3e18a',
        'Grúas y Elevación SL',
        'GE-2023-006',
        'FL006',
        920.75,
        'M-2468-KL',
        0,
        'Málaga Oeste',
        '6000 kg',
        'FAB2023006'
    ),
    (
        'fed6e39f-75cc-4869-9455-8531eab5e0b1',
        'Construcciones Rápidas',
        'CR-2023-007',
        'FL007',
        2800.25,
        'M-1357-MN',
        1500.75,
        'Zaragoza Sur',
        '2800 kg',
        'FAB2023007'
    ); 