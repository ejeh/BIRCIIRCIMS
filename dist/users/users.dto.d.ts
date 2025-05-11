export declare class UserPublicData {
    firstname: string;
    lastname: string;
    middlename: string;
    DOB: string;
    phone: number;
    community: string;
    religion: string;
    stateOfOrigin: string;
    email: string;
    nationality: string;
    gender: string;
    maritalStatus: string;
    nextOfKin: string;
    employmentHistory: string;
    business: string;
    educationalHistory: string;
    healthInfo: string;
    role: string;
    NIN: number;
    house_number: string;
    street_name: string;
    nearest_bus_stop_landmark: string;
    city_town: string;
    countryOfResidence: string;
    identification: string;
    id_number: string;
    issue_date: string;
    expiry_date: string;
    TIN: string;
    stateOfResidence: string;
    lgaOfResidence: string;
    lgaOfOrigin: string;
}
export declare class UpdateProfileDto {
    readonly passportPhoto?: string;
    readonly lastname?: string;
    readonly community?: string;
    readonly religion?: string;
    readonly middlename?: string;
    readonly house_number?: string;
    readonly maritalStatus?: string;
    readonly lgaOfOrigin?: string;
    readonly stateOfOrigin?: string;
    readonly street_name?: string;
    readonly nearest_bus_stop_landmark?: string;
    readonly city_town?: string;
    readonly countryOfResidence?: string;
    readonly address?: string;
    readonly nationality?: string;
    readonly DOB?: string;
    readonly gender?: string;
    readonly nextOfKin?: string;
    readonly employmentHistory?: string;
    readonly business?: string;
    readonly neighbor?: string;
    readonly educationalHistory?: string;
    readonly healthInfo?: string;
    readonly family?: string;
    readonly identification?: string;
    readonly id_number?: string;
    readonly issue_date?: string;
    readonly expiry_date?: string;
    readonly stateOfResidence?: string;
    readonly lgaOfResidence?: string;
}
export declare class UpdateUserRoleDto {
    role: string;
}
