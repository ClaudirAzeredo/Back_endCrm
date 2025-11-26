package crm.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "whatsapp_contacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhatsAppContact {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 32)
    private String id; // phone digits as primary key

    @Column(name = "name")
    private String name;

    @Column(name = "phone", nullable = false, length = 32)
    private String phone;

    @Column(name = "company_id")
    private String companyId;
}