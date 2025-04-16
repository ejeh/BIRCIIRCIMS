export declare class SigUpKindredDto {
    readonly userId: string;
    readonly firstname: string;
    readonly lastname: string;
    readonly address: string;
    readonly phone: number;
    readonly NIN: number;
    readonly kindred: string;
    readonly lga: string;
    readonly stateOfOrigin: string;
    readonly lgaOfOrigin: string;
    readonly email: string;
    readonly password: string;
}
export declare class UpdateKindredDto {
    readonly firstname?: string;
    readonly lastname?: string;
    readonly address?: string;
    readonly phone?: number;
    readonly kindred?: string;
    readonly lga?: string;
    readonly stateOfOrigin: string;
}
