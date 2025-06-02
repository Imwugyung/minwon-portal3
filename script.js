// 웹 페이지의 모든 콘텐츠가 로드된 후에 JavaScript 코드를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    // 필요한 DOM 요소들을 가져옵니다.
    const categoryLinks = document.querySelectorAll('.category-card ul li a');
    const messageDisplay = document.getElementById('message-display');
    const documentModal = document.getElementById('document-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeButton = document.querySelector('.close-button');
    const userInput = document.getElementById('user-input');
    const generateButton = document.getElementById('generate-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const generatedDocumentOutput = document.getElementById('generated-document-output');
    const documentText = document.getElementById('document-text');
    const copyButton = document.getElementById('copy-button');

    // 여기에 공주님의 Gemini API 키가 직접 입력되어 있습니다!
    const GEMINI_API_KEY = "AIzaSyAkQh6siedWSD97dPUqK2R4hMLamRVDJYk"; 

    let currentCategory = ''; // 현재 선택된 카테고리
    let currentAction = '';   // 현재 선택된 액션

    // 각 카테고리 링크에 클릭 이벤트 리스너를 추가합니다.
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // 기본 링크 동작(페이지 이동)을 막습니다.

            // 클릭된 링크의 data-category와 data-action 속성 값을 가져옵니다.
            currentCategory = link.dataset.category;
            currentAction = link.dataset.action;

            // 모달 제목을 설정합니다.
            modalTitle.textContent = `${currentCategory} - ${currentAction} 서류 작성`;
            userInput.value = ''; // 사용자 입력창 초기화
            generatedDocumentOutput.classList.add('hidden'); // 이전 결과 숨김
            loadingIndicator.classList.add('hidden'); // 로딩 인디케이터 숨김

            // 모달을 표시합니다.
            documentModal.style.display = 'flex'; // flex로 설정하여 CSS의 justify/align-items 적용
            documentModal.classList.remove('hidden'); // hidden 클래스 제거

            // 메시지 표시 div에 내용을 업데이트하고 보이게 합니다.
            const message = `"${currentCategory}" 카테고리의 "${currentAction}" 기능을 선택하셨습니다.`;
            messageDisplay.textContent = message;
            messageDisplay.classList.remove('hidden');

            // 메시지를 5초 후에 자동으로 숨깁니다.
            setTimeout(() => {
                messageDisplay.classList.add('hidden');
                messageDisplay.textContent = '';
            }, 5000);
        });
    });

    // 닫기 버튼 클릭 시 모달 숨김
    closeButton.addEventListener('click', () => {
        documentModal.style.display = 'none';
        documentModal.classList.add('hidden');
    });

    // 모달 외부 클릭 시 모달 숨김 (모달 내용 제외)
    window.addEventListener('click', (event) => {
        if (event.target == documentModal) {
            documentModal.style.display = 'none';
            documentModal.classList.add('hidden');
        }
    });

    // '서류 초안 작성하기' 버튼 클릭 이벤트
    generateButton.addEventListener('click', async () => {
        const inputContent = userInput.value.trim(); // 사용자 입력 내용 가져오기

        if (!inputContent) {
            messageDisplay.textContent = '자세한 내용을 입력해 주세요.';
            messageDisplay.classList.remove('hidden');
            setTimeout(() => {
                messageDisplay.classList.add('hidden');
                messageDisplay.textContent = '';
            }, 3000);
            return;
        }

        loadingIndicator.classList.remove('hidden'); // 로딩 인디케이터 표시
        generatedDocumentOutput.classList.add('hidden'); // 이전 결과 숨김
        documentText.textContent = ''; // 이전 텍스트 초기화

        try {
            // Gemini API 호출을 위한 프롬프트 구성
            const prompt = `당신은 민원 서류 자동 작성 전문가입니다. 다음 정보를 바탕으로 ${currentCategory} 카테고리의 "${currentAction}"에 대한 민원 서류 초안을 작성해 주세요. 사용자가 제공한 세부 내용은 다음과 같습니다:\n\n"${inputContent}"\n\n서류는 공손하고 명확하며, 필요한 모든 정보를 포함해야 합니다. 서류의 시작 부분에 제목을 포함하고, 본문은 구체적인 상황 설명을 담고, 마지막에는 요청 사항을 명확히 제시해 주세요.`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            // API 키를 직접 사용합니다.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API error: ${response.status} - ${errorData.error.message}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const generatedText = result.candidates[0].content.parts[0].text;
                documentText.textContent = generatedText; // 생성된 텍스트 표시
                generatedDocumentOutput.classList.remove('hidden'); // 결과 영역 표시
            } else {
                documentText.textContent = '서류 초안을 생성하는 데 실패했습니다. 다시 시도해 주세요.';
                generatedDocumentOutput.classList.add('hidden');
            }

        } catch (error) {
            console.error('서류 작성 중 오류 발생:', error);
            documentText.textContent = `오류 발생: ${error.message}. 다시 시도해 주세요.`;
            generatedDocumentOutput.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden'); // 로딩 인디케이터 숨김
        }
    });

    // '복사하기' 버튼 클릭 이벤트
    copyButton.addEventListener('click', () => {
        const textToCopy = documentText.textContent;
        if (textToCopy) {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                messageDisplay.textContent = '서류 초안이 클립보드에 복사되었습니다!';
                messageDisplay.classList.remove('hidden');
                setTimeout(() => {
                    messageDisplay.classList.add('hidden');
                    messageDisplay.textContent = '';
                }, 3000);
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
                messageDisplay.textContent = '클립보드 복사에 실패했습니다. 수동으로 복사해 주세요.';
                messageDisplay.classList.remove('hidden');
                setTimeout(() => {
                    messageDisplay.classList.add('hidden');
                    messageDisplay.textContent = '';
                }, 5000);
            }
            document.body.removeChild(textarea);
        }
    });
});
