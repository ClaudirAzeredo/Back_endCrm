package crm.dto;

// DTO de retorno para exposição do token
// code  = id sequencial (público)
// secret = segredo aleatório (apenas na criação; depois não é retornado novamente)
public record TokenPair(Long code, String secret) {}