using Agile360.Domain.Enums;

namespace Agile360.Application.StagingClientes.DTOs;

/// <summary>
/// Response DTO for a staging record sent to the dashboard for review.
/// </summary>
public record StagingClienteResponse(
    Guid Id,
    TipoPessoa TipoPessoa,
    string? Nome,
    string? CPF,
    string? RG,
    string? OrgaoExpedidor,
    string? RazaoSocial,
    string? CNPJ,
    string? InscricaoEstadual,
    string? Email,
    string? Telefone,
    string? WhatsAppNumero,
    DateOnly? DataReferencia,
    string? AreaAtuacao,
    string? Endereco,
    string? Observacoes,
    string Origem,
    string? OrigemMensagem,
    string Status,
    DateTimeOffset ExpiresAt,
    DateTimeOffset CreatedAt
);

/// <summary>
/// Request DTO used by the n8n bot to submit a pending client registration.
/// All fields are optional — the bot may collect partial data.
/// </summary>
public record CreateStagingClienteRequest(
    // Documento / identificação
    string? CPF,
    string? CNPJ,
    string? RG,
    string? OrgaoExpedidor,
    string? InscricaoEstadual,

    // Nome / tipo de cliente
    string? NomeCompleto,
    string? RazaoSocial,
    string? TipoCliente,

    // Contato
    string? Email,
    string? Telefone,
    string? WhatsAppNumero,

    // Endereço completo
    string? CEP,
    string? Estado,
    string? Cidade,
    string? Endereco,
    string? Numero,
    string? Bairro,
    string? Complemento,

    // Dados complementares
    DateOnly? DataReferencia,
    string? EstadoCivil,
    string? AreaAtuacao,
    string? NumeroConta,
    string? Pix,

    // Observações livres
    string? Observacoes,

    // Texto bruto e contexto da mensagem
    string? Mensagem
);

/// <summary>Lightweight summary used for the dashboard badge / card.</summary>
public record StagingCountResponse(int Pendentes);
