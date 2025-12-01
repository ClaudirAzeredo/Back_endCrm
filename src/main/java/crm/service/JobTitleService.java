package crm.service;

import crm.entity.JobTitle;
import crm.repository.JobTitleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class JobTitleService {
    public final JobTitleRepository jobTitleRepository;

    public JobTitleService(JobTitleRepository jobTitleRepository) {
        this.jobTitleRepository = jobTitleRepository;
    }

    public List<JobTitle> list(String companyId) {
        if (companyId == null || companyId.isBlank()) {
            return jobTitleRepository.findAll();
        }
        return jobTitleRepository.findAllByCompanyId(companyId);
    }

    public JobTitle save(JobTitle jobTitle) {
        return jobTitleRepository.save(jobTitle);
    }

    public JobTitle findById(String id) {
        Optional<JobTitle> jt = jobTitleRepository.findById(id);
        return jt.orElse(null);
    }
}