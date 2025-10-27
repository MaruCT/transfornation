import fetch from 'node-fetch';

async function checkAPI() {
  try {
    const response = await fetch('http://localhost:52270/api/projects');
    const data = await response.json();

    const testProject = data.find(p => p.id === 'proj-1761530601570');

    if (testProject) {
      console.log('✅ Project:', testProject.title);
      console.log('\n📊 Data counts:');
      console.log('  FAQ:', testProject.faq?.length || 0, 'items');
      console.log('  Team:', testProject.team?.length || 0, 'items');
      console.log('  Social Links:', testProject.socialLinks?.length || 0, 'items');
      console.log('  Rewards:', testProject.rewards?.length || 0, 'items');
      console.log('  Roadmap:', testProject.roadmap?.length || 0, 'items');
      console.log('  Media:', testProject.media?.length || 0, 'items');

      if (testProject.roadmap && testProject.roadmap.length > 0) {
        console.log('\n🗺️  Roadmap items:');
        testProject.roadmap.forEach((step, i) => {
          console.log(`  ${i+1}. ${step.milestone} - ${step.status}`);
        });
      }

      if (testProject.faq && testProject.faq.length > 0) {
        console.log('\n❓ FAQ items:');
        testProject.faq.forEach((faq, i) => {
          console.log(`  ${i+1}. ${faq.question}`);
        });
      }

      if (testProject.team && testProject.team.length > 0) {
        console.log('\n👥 Team items:');
        testProject.team.forEach((member, i) => {
          console.log(`  ${i+1}. ${member.name} - ${member.role}`);
        });
      }

      if (testProject.rewards && testProject.rewards.length > 0) {
        console.log('\n🎁 Rewards items:');
        testProject.rewards.forEach((reward, i) => {
          console.log(`  ${i+1}. ${reward.title} - $${reward.pledgeAmount}`);
        });
      }

      if (testProject.socialLinks && testProject.socialLinks.length > 0) {
        console.log('\n🔗 Social Links:');
        testProject.socialLinks.forEach((link, i) => {
          console.log(`  ${i+1}. ${link.platform} - ${link.url}`);
        });
      }
    } else {
      console.log('❌ Project not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAPI();
